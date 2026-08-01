"use client";

import { useRouter } from "next/navigation";
import OptionWheel from "@/components/reactbits/option-wheel";
import type { ThoughtMeta } from "@/lib/thoughts";

interface ThoughtView extends ThoughtMeta {
  preview: string;
}

interface Props {
  thoughts: ThoughtView[];
}

export default function ThoughtsClient({ thoughts }: Props) {
  const router = useRouter();
  const titles = thoughts.map((t) => t.frontmatter.title);

  function handleSelect(idx: number) {
    const target = thoughts[idx];
    if (target) router.push(`/thoughts/${target.slug}`);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">碎碎念念</h1>
      <p className="text-sm text-muted-fg mt-1">共 {thoughts.length} 条 · 滚动或拖动轮盘浏览，点击打开</p>

      {thoughts.length > 0 && (
        <div className="wheel-list mx-auto w-full max-w-md mt-4 h-[460px] sm:h-[520px]">
          <OptionWheel
            items={titles}
            defaultSelected={0}
            onItemClick={handleSelect}
            renderItem={(title, i, selected) => {
              const t = thoughts[i];
              return (
                <div className={`thoughts-wheel-card ${selected ? "selected" : ""}`}>
                  <div className="flex items-baseline justify-between gap-3 flex-wrap">
                    <span className="font-heading font-semibold text-sm">{title}</span>
                    <time dateTime={t.frontmatter.date} className="text-[11px] text-muted-fg">
                      {new Date(t.frontmatter.date).toLocaleDateString("zh-CN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                  </div>
                  <p className="text-xs text-muted-fg leading-relaxed mt-1 line-clamp-2">{t.preview}</p>
                </div>
              );
            }}
            textColor="var(--muted-fg)"
            activeColor="var(--color-accent)"
            side="left"
            inset={40}
            tilt={3}
            fontSize={3.5}
            spacing={1.6}
            blur={0.5}
            fade={0.35}
          />
        </div>
      )}
    </div>
  );
}
