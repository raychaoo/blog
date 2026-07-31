import Link from "next/link";
import type { PostMeta } from "@/lib/posts";

interface ArticleCardProps {
  post: PostMeta;
  index?: number;
}

const ACCENTS = [
  "var(--color-accent)",
  "var(--color-accent-violet)",
  "var(--color-accent-pink)",
  "var(--color-accent-cyan)",
  "var(--color-accent-emerald)",
  "var(--color-accent-amber)",
];

export default function ArticleCard({ post, index = 0 }: ArticleCardProps) {
  const { title, date, description, tags } = post.frontmatter;
  const accent = ACCENTS[index % ACCENTS.length];

  return (
    <Link href={`/posts/${post.slug}`} className="block h-full">
      <article className="article-card h-full">
        <div className="flex-1 flex flex-col">
          <div className="card-date text-sm mb-2">
            <time dateTime={date}>
              {new Date(date).toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </div>
          <h2 className="card-title text-lg font-heading font-semibold mb-2 leading-snug">
            {title}
          </h2>
          {description && (
            <p className="card-desc text-sm leading-relaxed flex-1">{description}</p>
          )}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {tags.map((tag, i) => (
                <span
                  key={tag}
                  className="tag-pill text-xs"
                  style={{ borderColor: accent, color: accent }}
                >
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
