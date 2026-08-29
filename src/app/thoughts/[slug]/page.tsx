import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getThoughtBySlug, getAllThoughtSlugs } from "@/lib/thoughts";
import { estimateReadingTime } from "@/lib/posts";
import { compileMdx } from "@/lib/mdx";
import CodeEnhancer from "@/components/mdx/code-enhancer";
import DynamicGiscus from "@/components/mdx/giscus-dynamic";
import SplitText from "@/components/reactbits/split-text";
import { Calendar, Clock, ArrowLeft } from "lucide-react";

interface ThoughtPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllThoughtSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ThoughtPageProps): Promise<Metadata> {
  const { slug } = await params;
  const thought = getThoughtBySlug(slug);
  if (!thought) return {};
  return {
    title: thought.frontmatter.title,
    description: extractDescription(thought.content),
    openGraph: {
      title: thought.frontmatter.title,
      type: "article",
      publishedTime: thought.frontmatter.date,
    },
  };
}

function extractDescription(content: string): string {
  const plain = content
    .split("\n")
    .map((line) => line.replace(/^#{1,6}\s+/, "").replace(/[*_`>#-]/g, "").trim())
    .filter(Boolean)
    .join(" ");
  return plain.length > 80 ? plain.slice(0, 80) + "…" : plain;
}

export default async function ThoughtPage({ params }: ThoughtPageProps) {
  const { slug } = await params;
  const thought = getThoughtBySlug(slug);
  if (!thought) notFound();

  const { content } = await compileMdx(thought.content);
  const { title, date } = thought.frontmatter;
  const readingTime = estimateReadingTime(thought.content);

  return (
    <div className="page-enter max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <Link
        href="/thoughts"
        className="btn-press inline-flex touch-target items-center gap-1.5 text-xs text-muted-fg hover:text-[var(--color-accent)] transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        返回碎碎念
      </Link>

      <header className="mb-8">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight leading-tight mb-4">
          <SplitText
            text={title}
            className="font-heading"
            delay={0.1}
            from={{ opacity: 0, y: 16 }}
            to={{ opacity: 1, y: 0 }}
          />
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-fg">
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={14} />
            <time dateTime={date}>
              {new Date(date).toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </span>
          <span className="w-1 h-1 rounded-full bg-current opacity-40" />
          <span className="inline-flex items-center gap-1.5">
            <Clock size={14} />
            {readingTime} 分钟阅读
          </span>
        </div>
      </header>

      <div className="prose" dangerouslySetInnerHTML={{ __html: content }} />
      <CodeEnhancer />

      {/* 评论区：与文章详情页共用 Giscus 配置 */}
      <div className="mt-10 sm:mt-12 pt-6 border-t border-[var(--card-border)] animate-fade-up">
        <DynamicGiscus />
      </div>
    </div>
  );
}
