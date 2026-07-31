"use client";

import { useEffect } from "react";
import ChromaGrid from "@/components/reactbits/chroma-grid";
import ArticleCard from "@/components/posts/article-card";
import type { PostMeta } from "@/lib/posts";

const SCROLL_KEY = "posts-scroll";

interface Props {
  posts: PostMeta[];
}

export default function PostsClient({ posts }: Props) {
  // 返回列表时恢复滚动位置
  useEffect(() => {
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved) {
      const y = parseInt(saved, 10);
      if (!isNaN(y)) requestAnimationFrame(() => window.scrollTo(0, y));
      sessionStorage.removeItem(SCROLL_KEY);
    }
  }, []);

  // 进入详情前记录滚动位置
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const link = (e.target as HTMLElement).closest("a");
      if (link && link.getAttribute("href")?.startsWith("/posts/")) {
        sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const items = posts.map((post) => ({
    image: post.frontmatter.coverImage || "",
    title: post.frontmatter.title,
    subtitle: post.frontmatter.description || post.frontmatter.date,
    url: `/posts/${post.slug}`,
    gradient: `linear-gradient(160deg, var(--color-accent), var(--bg-color) 180%)`,
    borderColor: "var(--color-accent)",
    post,
  }));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">文章</h1>
        <p className="text-sm text-muted-fg mt-1">共 {posts.length} 篇 · 记录技术学习与开发实践</p>
      </div>
      <ChromaGrid items={items} renderItem={(item, i) => <ArticleCard post={item.post!} index={i} />} />
    </div>
  );
}
