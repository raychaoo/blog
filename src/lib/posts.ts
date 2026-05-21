import fs from "fs";
import path from "path";
import matter from "gray-matter";

const postsDirectory = path.join(process.cwd(), "content", "posts");

export interface PostFrontmatter {
  title: string;
  date: string;
  description: string;
  tags?: string[];
  coverImage?: string;
}

export function estimateReadingTime(content: string): number {
  const cnChars = (content.match(/[一-鿿㐀-䶿豈-﫿]/g) || []).length;
  const enWords = content
    .replace(/[一-鿿㐀-䶿豈-﫿]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  const totalMinutes = cnChars / 350 + enWords / 200;
  return Math.max(1, Math.ceil(totalMinutes));
}

export interface PostMeta {
  slug: string;
  frontmatter: PostFrontmatter;
}

export interface Heading {
  id: string;
  text: string;
  level: number;
}

export interface PostWithContent extends PostMeta {
  content: string;
  headings: Heading[];
}

function isValidDate(date: string): boolean {
  return !isNaN(Date.parse(date));
}

export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const slugs = fs.readdirSync(postsDirectory, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  const posts = slugs
    .map((slug) => getPostMeta(slug))
    .filter((post): post is PostMeta => post !== null)
    .sort((a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime());

  return posts;
}

export function getPostMeta(slug: string): PostMeta | null {
  try {
    const filePath = path.join(postsDirectory, slug, "index.mdx");
    if (!fs.existsSync(filePath)) return null;

    const source = fs.readFileSync(filePath, "utf-8");
    const { data } = matter(source);

    if (!data.title || !data.date || !isValidDate(data.date)) return null;

    return {
      slug,
      frontmatter: {
        title: data.title,
        date: data.date,
        description: data.description || "",
        tags: Array.isArray(data.tags) ? data.tags : [],
        coverImage: data.coverImage || undefined,
      },
    };
  } catch {
    return null;
  }
}

export function getPostBySlug(slug: string): { frontmatter: PostFrontmatter; content: string } | null {
  try {
    const filePath = path.join(postsDirectory, slug, "index.mdx");
    if (!fs.existsSync(filePath)) return null;

    const source = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(source);

    return {
      frontmatter: {
        title: data.title,
        date: data.date,
        description: data.description || "",
        tags: Array.isArray(data.tags) ? data.tags : [],
        coverImage: data.coverImage || undefined,
      },
      content,
    };
  } catch {
    return null;
  }
}

export function getAllTags(): string[] {
  const posts = getAllPosts();
  const tagSet = new Set<string>();
  posts.forEach((post) => {
    post.frontmatter.tags?.forEach((tag) => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
}

export function getAllSlugs(): string[] {
  if (!fs.existsSync(postsDirectory)) return [];

  return fs.readdirSync(postsDirectory, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
}
