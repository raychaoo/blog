import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import type { Heading } from "./posts";
import type { Root } from "hast";

const prettyCodeOptions = {
  theme: {
    light: "github-light",
    dark: "github-dark",
  },
  keepBackground: false,
};

const transformer = () => (tree: Root) => {
  const h2s: Heading[] = [];
  visit(tree, "element", (node) => {
    if (node.tagName === "h2" || node.tagName === "h3") {
      const text = node.children
        .filter((child: any) => child.type === "text")
        .map((child: any) => child.value)
        .join("");
      const id = node.properties?.id as string;
      if (id && text) {
        h2s.push({
          id,
          text,
          level: node.tagName === "h2" ? 2 : 3,
        });
      }
    }
  });
  return h2s;
};

export async function compileMdx(source: string): Promise<{ content: string; headings: Heading[] }> {
  let headings: Heading[] = [];

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    // @ts-expect-error - plugin type mismatch between @types/hast versions
    .use(rehypeSlug)
    .use(() => (tree: Root) => {
      if (headings.length === 0) {
        headings = transformer()(tree);
      }
    })
    .use(rehypeAutolinkHeadings, { behavior: "wrap" })
    // @ts-expect-error - plugin type mismatch between @types/hast versions
    .use(rehypePrettyCode, prettyCodeOptions)
    .use(rehypeStringify);

  const result = await processor.process(source);
  const content = String(result);

  return { content, headings };
}
