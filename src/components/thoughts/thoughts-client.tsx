"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import OptionWheel from "@/components/reactbits/option-wheel";
import type { ThoughtMeta } from "@/lib/thoughts";

// Preview is computed server-side (page.tsx) and passed in to keep the
// client bundle free of the Node-only (fs/path) module.
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
      <p className="text-sm text-muted-fg mt-1">共 {thoughts.length} 条 · 一些碎片化的想法与日常</p>

      {thoughts.length > 0 && (
        <div className="wheel-wrap flex justify-center py-10">
          <OptionWheel
            items={titles}
            onChange={handleSelect}
            textColor="var(--muted-fg)"
            activeColor="var(--color-accent)"
          />
        </div>
      )}

      <ol className="thoughts-timeline">
        {thoughts.map((thought, i) => (
          <li
            key={thought.slug}
            className="thoughts-item"
            style={{ animationDelay: `${Math.min(i * 90, 720)}ms` }}
          >
            <Link href={`/thoughts/${thought.slug}`} className="thoughts-card block">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <h2 className="font-heading font-semibold text-base">{thought.frontmatter.title}</h2>
                <time
                  dateTime={thought.frontmatter.date}
                  className="text-xs text-muted-fg"
                >
                  {new Date(thought.frontmatter.date).toLocaleDateString("zh-CN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              </div>
              <p className="text-sm text-muted-fg leading-relaxed mt-2 line-clamp-3">
                {thought.preview}
              </p>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
