"use client";

import { useTagContext } from "@/components/tag-context";

interface SidebarProps {
  allPostsCount: number;
  tags: string[];
  startYear: string;
  githubAvatarUrl: string | null;
  githubName: string;
}

export default function Sidebar({ allPostsCount, tags, startYear, githubAvatarUrl, githubName }: SidebarProps) {
  const { activeTag, setActiveTag } = useTagContext();

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="space-y-5 lg:sticky lg:top-0 lg:pt-14">
        {/* Author Card */}
        <div className="sidebar-card rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
          {githubAvatarUrl ? (
            <img
              src={githubAvatarUrl}
              alt={githubName}
              className="w-12 h-12 rounded-full mb-3 shadow-sm"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-accent)] via-[var(--color-accent-violet)] to-[var(--color-accent-pink)] flex items-center justify-center text-white font-heading font-bold text-sm mb-3 shadow-sm">
              {githubName.charAt(0).toUpperCase()}
            </div>
          )}
          <h3 className="font-heading font-semibold text-sm mb-1">{githubName}</h3>
          <p className="text-xs text-muted-fg leading-relaxed">
            全栈开发者，专注于 React、Next.js 和 TypeScript。
          </p>
        </div>

        {/* Stats */}
        <div className="sidebar-card rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
          <h4 className="font-heading text-xs font-semibold text-muted-fg uppercase tracking-wider mb-3">
            统计
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-lg font-heading font-bold" style={{ color: "var(--color-accent)" }}>{allPostsCount}</div>
              <div className="text-xs text-muted-fg">文章</div>
            </div>
            <div>
              <div className="text-lg font-heading font-bold" style={{ color: "var(--color-accent-pink)" }}>{tags.length}</div>
              <div className="text-xs text-muted-fg">标签</div>
            </div>
            <div>
              <div className="text-lg font-heading font-bold" style={{ color: "var(--color-accent-cyan)" }}>{startYear}</div>
              <div className="text-xs text-muted-fg">始于</div>
            </div>
          </div>
        </div>

        {/* Tags Cloud */}
        {tags.length > 0 && (
          <div className="sidebar-card rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
            <h4 className="font-heading text-xs font-semibold text-muted-fg uppercase tracking-wider mb-3">
              标签
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t, i) => {
                const colorClass = ["tag-indigo", "tag-pink", "tag-cyan", "tag-emerald", "tag-amber", "tag-violet"][i % 6];
                return (
                  <button
                    key={t}
                    onClick={() => setActiveTag(t === activeTag ? null : t)}
                    className={`tag-pill text-xs ${colorClass} cursor-pointer ${activeTag === t ? "active" : ""}`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* About Blog */}
        <div className="sidebar-card rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
          <h4 className="font-heading text-xs font-semibold text-muted-fg uppercase tracking-wider mb-2">
            关于
          </h4>
          <p className="text-xs text-muted-fg leading-relaxed">
            记录技术学习与开发实践，涵盖前端工程化、React 生态、开发效率等话题。
          </p>
        </div>
      </div>
    </aside>
  );
}
