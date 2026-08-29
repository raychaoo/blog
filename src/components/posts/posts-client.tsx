"use client";

import { useEffect } from "react";
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">文章</h1>
        <p className="text-sm text-muted-fg mt-1">共 {posts.length} 篇 · 记录技术学习与开发实践</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
        {posts.map((post) => (
          <ArticleCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}
