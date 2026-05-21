import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getPostBySlug, getAllSlugs, estimateReadingTime } from '@/lib/posts';
import { compileMdx } from '@/lib/mdx';
import Toc from '@/components/toc';
import DynamicGiscus from '@/components/giscus-dynamic';
import CodeEnhancer from '@/components/code-enhancer';
import { Calendar, Clock, ArrowLeft, Tag } from 'lucide-react';

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    openGraph: {
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      type: 'article',
      publishedTime: post.frontmatter.date,
      tags: post.frontmatter.tags,
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const { content, headings } = await compileMdx(post.content);
  const { title, date, tags, coverImage } = post.frontmatter;
  const readingTime = estimateReadingTime(post.content);

  return (
    <div className='page-enter max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10'>
      {/* Back link */}
      <Link
        href='/'
        className='inline-flex touch-target items-center gap-1.5 text-xs text-muted-fg hover:text-fg transition-colors mb-6'
      >
        <ArrowLeft size={14} />
        返回首页
      </Link>

      {/* Cover Image */}
      {coverImage && (
        <div className='rounded-xl overflow-hidden mb-6 sm:mb-8 border border-[var(--card-border)] animate-fade-in max-w-3xl'>
          <img
            src={coverImage}
            alt={title}
            className='w-full aspect-[2/1] object-cover'
          />
        </div>
      )}

      {/* Sticky Article Header */}
      <div className='pb-4' style={{ background: 'var(--bg-color)' }}>
        <header className='mb-6 sm:mb-8'>
          <h1 className='font-heading text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-4 leading-tight'>
            {title}
          </h1>

          <div className='flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-muted-fg'>
            <span className='inline-flex items-center gap-1.5'>
              <Calendar size={14} />
              <time dateTime={date}>
                {new Date(date).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </span>
            <span className='w-1 h-1 rounded-full bg-current opacity-40' />
            <span className='inline-flex items-center gap-1.5'>
              <Clock size={14} />
              {readingTime} 分钟阅读
            </span>
            {tags && tags.length > 0 && (
              <>
                <span className='w-1 h-1 rounded-full bg-current opacity-40' />
                <span className='inline-flex items-center gap-1.5 flex-wrap'>
                  <Tag size={14} />
                  {tags.map((tag, i) => (
                    <Link
                      key={tag}
                      href={`/?tag=${encodeURIComponent(tag)}`}
                      className={`tag-pill text-[11px] cursor-pointer ${['tag-indigo', 'tag-pink', 'tag-cyan', 'tag-emerald', 'tag-amber', 'tag-violet'][i % 6]}`}
                    >
                      {tag}
                    </Link>
                  ))}
                </span>
              </>
            )}
          </div>
        </header>
      </div>

      {/* Content + Sidebar */}
      <div className='flex gap-8 lg:gap-12 items-start'>
        <div className='min-w-0 flex-1 max-w-3xl'>
          <div
            className='prose'
            dangerouslySetInnerHTML={{ __html: content }}
          />

          <CodeEnhancer />

          <div className='mt-10 sm:mt-12 pt-6 border-t border-[var(--card-border)]'>
            <Link
              href='/'
              className='inline-flex touch-target items-center gap-1.5 text-sm text-fg hover:text-[var(--color-accent)] transition-colors font-medium'
            >
              <ArrowLeft size={16} />
              返回首页
            </Link>
          </div>

          <DynamicGiscus />
        </div>

        <aside className='hidden lg:block w-56 shrink-0 self-stretch'>
          <div className='sticky top-24'>
            <Toc headings={headings} />
          </div>
        </aside>
      </div>
    </div>
  );
}
