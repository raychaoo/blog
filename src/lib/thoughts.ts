import fs from "fs";
import path from "path";
import matter from "gray-matter";

const thoughtsDirectory = path.join(process.cwd(), "content", "thoughts");

export interface ThoughtFrontmatter {
  title: string;
  date: string;
}

export interface ThoughtMeta {
  slug: string;
  frontmatter: ThoughtFrontmatter;
}

export interface ThoughtWithContent extends ThoughtMeta {
  content: string;
}

function isValidDate(date: string): boolean {
  return !isNaN(Date.parse(date));
}

export function getAllThoughts(): ThoughtWithContent[] {
  if (!fs.existsSync(thoughtsDirectory)) return [];
  return fs
    .readdirSync(thoughtsDirectory, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .map((slug) => getThoughtBySlug(slug))
    .filter((t): t is ThoughtWithContent => t !== null)
    .sort((a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime());
}

export function getThoughtBySlug(slug: string): ThoughtWithContent | null {
  try {
    const filePath = path.join(thoughtsDirectory, slug, "index.mdx");
    if (!fs.existsSync(filePath)) return null;
    const source = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(source);
    if (!data.title || !data.date || !isValidDate(data.date)) return null;
    return {
      slug,
      frontmatter: { title: data.title, date: data.date },
      content,
    };
  } catch {
    return null;
  }
}

export function getAllThoughtSlugs(): string[] {
  if (!fs.existsSync(thoughtsDirectory)) return [];
  return fs
    .readdirSync(thoughtsDirectory, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}

export function extractPreview(content: string, maxLines = 3): string {
  const lines = content
    .split("\n")
    .filter((line) => !/^#{1,6}\s+/.test(line))
    .map((line) =>
      line
        .replace(/^#{1,6}\s+/, "")
        // 图片与链接只保留可读文本,避免预览泄漏 Markdown 原始语法
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/[*_`>#-]/g, "")
        .trim()
    )
    .filter(Boolean);
  const preview = lines.slice(0, maxLines).join(" ");
  return preview.length > 120 ? preview.slice(0, 120).trimEnd() + "…" : preview;
}
