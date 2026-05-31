"use client";

import TagProvider from "@/components/tag-context";
import TagFilterWrapper from "@/components/tag-filter-wrapper";
import GithubContributions from "@/components/github-contributions";
import type { PostMeta } from "@/lib/posts";

interface Props {
  tags: string[];
  posts: PostMeta[];
  allPostsCount: number;
  startYear: string;
  githubAvatarUrl: string | null;
  githubName: string;
  githubUsername: string;
}

export default function HomeClient({ tags, posts, allPostsCount, startYear, githubAvatarUrl, githubName, githubUsername }: Props) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* ── Compact Hero + Profile (was Sidebar content) ── */}
      <section>
        {/* Profile Card — merged from old Sidebar */}
        <div>
          <div className="sidebar-card rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-5 sm:p-6">
            {/* Author row + Stats inline */}
            <div className="flex items-center gap-4 mb-4">
              {githubAvatarUrl ? (
                <img
                  src={githubAvatarUrl}
                  alt={githubName}
                  className="w-14 h-14 rounded-full shadow-sm shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--color-accent)] via-[var(--color-accent-violet)] to-[var(--color-accent-pink)] flex items-center justify-center text-white font-heading font-bold text-lg shadow-sm shrink-0">
                  {githubName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h3 className="font-heading font-semibold text-sm">{githubName}</h3>
                  <div className="flex items-center gap-4 text-center">
                    <div>
                      <span className="text-sm font-heading font-bold" style={{ color: "var(--color-accent)" }}>{allPostsCount}</span>
                      <span className="text-xs text-muted-fg ml-1">文章</span>
                    </div>
                    <div>
                      <span className="text-sm font-heading font-bold" style={{ color: "var(--color-accent-pink)" }}>{tags.length}</span>
                      <span className="text-xs text-muted-fg ml-1">标签</span>
                    </div>
                    <div>
                      <span className="text-sm font-heading font-bold" style={{ color: "var(--color-accent-cyan)" }}>{startYear}</span>
                      <span className="text-xs text-muted-fg ml-1">始于</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-fg leading-relaxed mt-1">
                  全栈开发者，专注于 React、Next.js 和 TypeScript。
                </p>
              </div>
            </div>

            {/* GitHub Contribution Graph */}
            <GithubContributions username={githubUsername} />

            {/* About */}
            <p className="text-xs text-muted-fg leading-relaxed">
              记录技术学习与开发实践，涵盖前端工程化、React 生态、开发效率等话题。
            </p>
          </div>
        </div>
      </section>

      {/* ── Article Section (full width, top-bottom) ── */}
      <TagProvider>
        <TagFilterWrapper tags={tags} posts={posts} />
      </TagProvider>
    </div>
  );
}
