"use client";

import Hero from "@/components/home/hero";
import GithubContributions from "./github-contributions";

interface Props {
  githubAvatarUrl: string | null;
  githubName: string;
  githubUsername: string;
  postCount: number;
  tagCount: number;
}

export default function HomeClient({ githubAvatarUrl, githubName, githubUsername, postCount, tagCount }: Props) {
  const startYear = "2020";

  // 暂隐藏:右侧个人信息流(头像/统计/贡献图/简介),定稿后翻回 true
  const showInfoColumn = false;

  return (
    // Lanyard 3D 挂绳卡沾满全屏(100dvh - 56px 粘性头部)
    <div className="w-full">
      <Hero name={githubName} />

      {showInfoColumn && (
        <aside className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:gap-8">
        {githubAvatarUrl ? (
          <img
            src={githubAvatarUrl}
            alt={githubName}
            className="h-16 w-16 rounded-full border border-[var(--card-border)] shadow-sm"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-accent)] via-[var(--color-accent-violet)] to-[var(--color-accent-pink)] font-heading text-xl font-bold text-white shadow-sm">
            {githubName.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex divide-x divide-[var(--card-border)]">
          <Stat value={String(postCount)} label="文章" color="var(--color-accent)" />
          <Stat value={String(tagCount)} label="标签" color="var(--color-accent-pink)" />
          <Stat value={startYear} label="始于" color="var(--color-accent-cyan)" />
        </div>

        <div className="sidebar-card rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-4 sm:p-5">
          <GithubContributions username={githubUsername} />
        </div>

          <p className="text-sm leading-relaxed text-muted-fg">
            全栈开发者，专注于 React、Next.js 和 TypeScript。记录技术学习与开发实践，涵盖前端工程化、React
            生态、开发效率等话题。
          </p>
        </aside>
      )}
    </div>
  );
}

function Stat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="flex-1 px-4 text-center first:pl-0 last:pr-0 sm:px-6">
      <div className="font-heading text-xl font-bold tabular-nums sm:text-2xl" style={{ color }}>
        {value}
      </div>
      <div className="mt-0.5 text-xs text-muted-fg">{label}</div>
    </div>
  );
}
