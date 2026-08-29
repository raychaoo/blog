import Link from "next/link";
import type { PostMeta } from "@/lib/posts";

interface ArticleCardProps {
  post: PostMeta;
}

/** 紧凑日期:2026-08-23(本地时区取值,避免 toISOString 的 UTC 偏移) */
export function formatCompactDate(date: string): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function ArticleCard({ post }: ArticleCardProps) {
  const { title, date, description, tags } = post.frontmatter;

  return (
    <Link href={`/posts/${post.slug}`} className="btn-press block h-full">
      <article className="article-card h-full">
        <h2 className="card-title text-lg font-heading font-semibold mb-2 leading-snug">
          {title}
        </h2>
        {description && (
          <p className="card-desc text-sm leading-relaxed">{description}</p>
        )}
        {/* meta 行钉在卡片底部,同行卡片底部对齐 */}
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-4">
          <time dateTime={date} className="card-date text-xs tabular-nums">
            {formatCompactDate(date)}
          </time>
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span key={tag} className="tag-pill text-xs">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
