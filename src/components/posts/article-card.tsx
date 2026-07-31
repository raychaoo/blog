import Link from "next/link";
import type { PostMeta } from "@/lib/posts";

interface ArticleCardProps {
  post: PostMeta;
}

export default function ArticleCard({ post }: ArticleCardProps) {
  const { title, date, description, tags, coverImage } = post.frontmatter;

  return (
    <Link href={`/posts/${post.slug}`}>
      <article className="article-card">
        {coverImage && (
          <div className="cover-image-wrap">
            <img
              src={coverImage}
              alt={title}
              className="w-full h-40 object-cover"
              loading="lazy"
            />
          </div>
        )}
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
            <p className="card-desc text-sm leading-relaxed flex-1">
              {description}
            </p>
          )}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {tags.map((tag, i) => (
                <span key={tag} className={`tag-pill text-xs ${["tag-indigo", "tag-pink", "tag-cyan", "tag-emerald", "tag-amber", "tag-violet"][i % 6]}`}>
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
