"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { List, Orbit } from "lucide-react";
import OptionWheel from "@/components/reactbits/option-wheel";
import type { ThoughtMeta } from "@/lib/thoughts";

const WHEEL_RETURN_KEY = "thoughts-wheel-return";
const VIEW_KEY = "thoughts-view";

type View = "timeline" | "wheel";

interface ThoughtView extends ThoughtMeta {
  preview: string;
}

interface Props {
  thoughts: ThoughtView[];
}

export default function ThoughtsClient({ thoughts }: Props) {
  const router = useRouter();
  const [view, setView] = useState<View>("timeline");
  const [restoreIdx, setRestoreIdx] = useState<number | null>(null);
  // 时间线视图下,从详情返回时恢复到上次点击的条目(一次性)
  const pendingRestoreSlug = useRef<string | null>(null);

  // 初始化:读取视图偏好 + 从详情返回的目标 slug
  useEffect(() => {
    const slug = sessionStorage.getItem(WHEEL_RETURN_KEY);
    sessionStorage.removeItem(WHEEL_RETURN_KEY);
    if (slug) pendingRestoreSlug.current = slug;
    const idx = slug ? thoughts.findIndex((t) => t.slug === slug) : -1;
    if (idx !== -1) setRestoreIdx(idx);
    if (localStorage.getItem(VIEW_KEY) === "wheel") setView("wheel");
  }, [thoughts]);

  // 时间线:等列表渲染后把返回目标滚进视口
  useEffect(() => {
    if (view !== "timeline") return;
    const slug = pendingRestoreSlug.current;
    if (!slug) return;
    pendingRestoreSlug.current = null;
    document.getElementById(`thought-${slug}`)?.scrollIntoView({ block: "center" });
  }, [view, thoughts]);

  function switchView(next: View) {
    setView(next);
    localStorage.setItem(VIEW_KEY, next);
  }

  function handleSelect(idx: number) {
    const target = thoughts[idx];
    if (target) {
      sessionStorage.setItem(WHEEL_RETURN_KEY, target.slug);
      router.push(`/thoughts/${target.slug}`);
    }
  }

  function openThought(slug: string) {
    sessionStorage.setItem(WHEEL_RETURN_KEY, slug);
    router.push(`/thoughts/${slug}`);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">碎碎念</h1>
          <p className="text-sm text-muted-fg mt-1">
            共 {thoughts.length} 条
            {view === "wheel" ? " · 滚动或拖动浏览，点击高亮的卡片打开" : " · 点击卡片阅读"}
          </p>
        </div>

        {/* 视图切换:列表(默认)/ 轮盘 */}
        <div
          className="flex items-center gap-0.5 rounded-full border border-[var(--card-border)] p-0.5 text-xs"
          role="group"
          aria-label="浏览方式"
        >
          <button
            type="button"
            onClick={() => switchView("timeline")}
            aria-pressed={view === "timeline"}
            className={`inline-flex touch-target items-center gap-1 rounded-full px-3 py-1 transition-colors cursor-pointer ${
              view === "timeline"
                ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
                : "text-muted-fg hover:text-fg"
            }`}
          >
            <List size={13} />
            列表
          </button>
          <button
            type="button"
            onClick={() => switchView("wheel")}
            aria-pressed={view === "wheel"}
            className={`inline-flex touch-target items-center gap-1 rounded-full px-3 py-1 transition-colors cursor-pointer ${
              view === "wheel"
                ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)]"
                : "text-muted-fg hover:text-fg"
            }`}
          >
            <Orbit size={13} />
            轮盘
          </button>
        </div>
      </div>

      {view === "timeline" ? (
        thoughts.length > 0 && (
          <ol className="mt-6 flex flex-col gap-3">
            {thoughts.map((t) => {
              const d = new Date(t.frontmatter.date);
              return (
                <li key={t.slug} id={`thought-${t.slug}`}>
                  <button
                    type="button"
                    onClick={() => openThought(t.slug)}
                    className="group flex w-full cursor-pointer items-start gap-4 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 text-left shadow-[var(--card-shadow)] transition-colors hover:border-[var(--color-accent)]"
                  >
                    <time
                      dateTime={t.frontmatter.date}
                      className="w-12 shrink-0 self-stretch flex flex-col items-center justify-center border-r border-[var(--card-border)] pr-4"
                    >
                      <span className="font-heading text-sm font-semibold leading-none">
                        {String(d.getMonth() + 1).padStart(2, "0")}/{String(d.getDate()).padStart(2, "0")}
                      </span>
                      <span className="text-[10px] text-muted-fg leading-none mt-1">{d.getFullYear()}</span>
                    </time>
                    <span className="min-w-0 flex-1 block">
                      <span className="block font-heading font-semibold text-sm truncate transition-colors group-hover:text-[var(--color-accent)]">
                        {t.frontmatter.title}
                      </span>
                      <span className="block text-xs text-muted-fg leading-relaxed mt-1 line-clamp-2">
                        {t.preview}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        )
      ) : (
        thoughts.length > 0 && (
          <div className="wheel-list mx-auto w-full max-w-md mt-4 h-[460px] sm:h-[520px]">
            <OptionWheel
              items={thoughts.map((t) => t.frontmatter.title)}
              defaultSelected={0}
              initialScrollTo={restoreIdx ?? undefined}
              onItemClick={handleSelect}
              renderItem={(title, i, selected) => {
                const t = thoughts[i];
                const d = new Date(t.frontmatter.date);
                return (
                  <div className={`thoughts-wheel-card ${selected ? "selected" : ""}`}>
                    <div className="flex items-center gap-3">
                      <time
                        dateTime={t.frontmatter.date}
                        className="shrink-0 self-stretch flex flex-col items-center justify-center pr-3 border-r border-surface"
                      >
                        <span className="font-heading text-[13px] font-semibold leading-none">
                          {String(d.getMonth() + 1).padStart(2, "0")}/{String(d.getDate()).padStart(2, "0")}
                        </span>
                        <span className="text-[10px] text-muted-fg leading-none mt-1">{d.getFullYear()}</span>
                      </time>
                      <div className="min-w-0 flex-1">
                        <div className="font-heading font-semibold text-sm truncate">{title}</div>
                        <p className="text-xs text-muted-fg leading-relaxed mt-1 line-clamp-2">{t.preview}</p>
                      </div>
                    </div>
                  </div>
                );
              }}
              textColor="var(--muted-fg)"
              activeColor="var(--color-accent)"
              side="left"
              inset={40}
              tilt={3}
              fontSize={3.5}
              spacing={1.75}
              blur={0.5}
              fade={0.35}
            />
          </div>
        )
      )}
    </div>
  );
}
