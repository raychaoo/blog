"use client";

import Link from "next/link";
import { Rss, ArrowRight } from "lucide-react";
import GithubMark from "@/components/nav/github-mark";
import Hero from "@/components/home/hero";
import GithubContributions from "./github-contributions";

export interface RecentPost {
  slug: string;
  title: string;
  date: string;
}

interface Props {
  githubAvatarUrl: string | null;
  githubName: string;
  githubUsername: string;
  postCount: number;
  tagCount: number;
  recentPosts: RecentPost[];
}

export default function HomeClient({
  githubAvatarUrl,
  githubName,
  githubUsername,
  postCount,
  tagCount,
  recentPosts,
}: Props) {
  const startYear = "2020";

  return (
    // 两段式:上段 hero(3D 挂绳卡 + 滚动指示),下段「关于我 + 最近文章」
    <div className="w-full">
      <Hero name={githubName} />

      <section
        id="home-about"
        className="mx-auto w-full max-w-4xl scroll-mt-20 px-4 pb-16 sm:px-6"
      >
        <h2 className="sr-only">关于我</h2>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-6">
          <div className="flex items-center gap-4">
            {githubAvatarUrl ? (
              <img
                src={githubAvatarUrl}
                alt={githubName}
                className="h-14 w-14 rounded-full border border-[var(--card-border)] shadow-sm"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-accent)] via-[var(--color-accent-violet)] to-[var(--color-accent-pink)] font-heading text-xl font-bold text-white shadow-sm">
                {githubName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="font-heading text-lg font-semibold">
                {githubName}
              </div>
              <div className="text-sm text-muted-fg">
                @{githubUsername}
              </div>
            </div>
          </div>

          <div className="flex divide-x divide-[var(--card-border)]">
            <Stat
              value={String(postCount)}
              label="文章"
              color="var(--color-accent)"
            />
            <Stat
              value={String(tagCount)}
              label="标签"
              color="var(--color-accent-pink)"
            />
            <Stat
              value={startYear}
              label="始于"
              color="var(--color-accent-cyan)"
            />
          </div>

          <div className="flex items-center gap-4 sm:ml-auto">
            <a
              href={`https://github.com/${githubUsername}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex touch-target items-center gap-1.5 text-sm text-muted-fg transition-colors hover:text-fg"
            >
              <GithubMark size={16} />
              GitHub
            </a>
            <a
              href="/rss.xml"
              className="inline-flex touch-target items-center gap-1.5 text-sm text-muted-fg transition-colors hover:text-fg"
            >
              <Rss size={16} />
              RSS
            </a>
          </div>
        </div>

        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-fg">
          写代码、记笔记，偶尔也折腾点别的。
          这个博客是我整理笔记和踩坑的地方，写给自己看，顺便也能给别人参考。
        </p>

        <div className="sidebar-card mt-6 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-4 sm:p-5">
          <GithubContributions username={githubUsername} />
        </div>

        <div className="mt-12">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="font-heading text-xl font-bold tracking-tight">
              最近更新
            </h2>
            <Link
              href="/posts"
              className="inline-flex items-center gap-1 text-sm text-muted-fg transition-colors hover:text-[var(--color-accent)]"
            >
              全部文章
              <ArrowRight size={14} />
            </Link>
          </div>
          <ul>
            {recentPosts.map((post) => (
              <li
                key={post.slug}
                className="border-b border-[var(--card-border)] last:border-b-0"
              >
                <Link
                  href={`/posts/${post.slug}`}
                  className="group flex items-baseline justify-between gap-6 py-3"
                >
                  <span className="min-w-0 truncate text-sm font-medium transition-colors group-hover:text-[var(--color-accent)]">
                    {post.title}
                  </span>
                  <time
                    dateTime={post.date}
                    className="shrink-0 text-xs tabular-nums text-muted-fg"
                  >
                    {formatCompactDate(post.date)}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function formatCompactDate(date: string): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function Stat({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div className="flex-1 px-4 text-center first:pl-0 last:pr-0 sm:px-6">
      <div
        className="font-heading text-xl font-bold tabular-nums sm:text-2xl"
        style={{ color }}
      >
        {value}
      </div>
      <div className="mt-0.5 text-xs text-muted-fg">{label}</div>
    </div>
  );
}
