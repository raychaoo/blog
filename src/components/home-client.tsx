"use client";

import TagProvider from "@/components/tag-context";
import TagFilterWrapper from "@/components/tag-filter-wrapper";
import Sidebar from "@/components/sidebar";
import type { PostMeta } from "@/lib/posts";

interface Props {
  tags: string[];
  posts: PostMeta[];
  allPostsCount: number;
  startYear: string;
  githubAvatarUrl: string | null;
  githubName: string;
}

export default function HomeClient({ tags, posts, allPostsCount, startYear, githubAvatarUrl, githubName }: Props) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Compact Hero */}
      <section className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="w-8 h-0.5 rounded-full bg-gradient-to-r from-[var(--color-accent)] via-[var(--color-accent-violet)] to-[var(--color-accent-pink)]" />
          <span className="w-2 h-0.5 rounded-full bg-[var(--color-accent-cyan)] opacity-40" />
          <span className="w-1.5 h-0.5 rounded-full bg-[var(--color-accent-amber)] opacity-25" />
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-3">
          VibeCoding Blog
        </h1>
        <p className="text-muted-fg text-sm sm:text-base max-w-md mx-auto leading-relaxed">
          写代码，写文字，写生活。
        </p>
      </section>

      <TagProvider>
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          <div className="flex-1 min-w-0">
            <TagFilterWrapper tags={tags} posts={posts} />
          </div>
          <Sidebar
            allPostsCount={allPostsCount}
            tags={tags}
            startYear={startYear}
            githubAvatarUrl={githubAvatarUrl}
            githubName={githubName}
          />
        </div>
      </TagProvider>
    </div>
  );
}
