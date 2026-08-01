"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OptionWheel from "@/components/reactbits/option-wheel";
import type { ThoughtMeta } from "@/lib/thoughts";

const WHEEL_RETURN_KEY = "thoughts-wheel-return";

interface ThoughtView extends ThoughtMeta {
  preview: string;
}

interface Props {
  thoughts: ThoughtView[];
}

export default function ThoughtsClient({ thoughts }: Props) {
  const router = useRouter();
  const titles = thoughts.map((t) => t.frontmatter.title);
  const [restoreIdx, setRestoreIdx] = useState<number | null>(null);

  // 从详情返回时恢复轮盘位置:读取上次点击的 slug,解析为当前列表索引,一次性恢复
  useEffect(() => {
    const slug = sessionStorage.getItem(WHEEL_RETURN_KEY);
    sessionStorage.removeItem(WHEEL_RETURN_KEY);
    if (!slug) return;
    const idx = thoughts.findIndex((t) => t.slug === slug);
    if (idx !== -1) setRestoreIdx(idx);
  }, [thoughts]);

  function handleSelect(idx: number) {
    const target = thoughts[idx];
    if (target) {
      sessionStorage.setItem(WHEEL_RETURN_KEY, target.slug);
      router.push(`/thoughts/${target.slug}`);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">碎碎念念</h1>
      <p className="text-sm text-muted-fg mt-1">共 {thoughts.length} 条 · 滚动或拖动浏览，点击高亮的卡片打开</p>

      {thoughts.length > 0 && (
        <div className="wheel-list mx-auto w-full max-w-md mt-4 h-[460px] sm:h-[520px]">
          <OptionWheel
            items={titles}
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
      )}
    </div>
  );
}
