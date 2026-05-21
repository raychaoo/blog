'use client';

import ArticleCard from '@/components/article-card';
import { useTagContext } from '@/components/tag-context';
import type { PostMeta } from '@/lib/posts';
import { useMemo } from 'react';

interface Props {
  tags: string[];
  posts: PostMeta[];
}

export default function TagFilterWrapper({ tags, posts }: Props) {
  const { activeTag, setActiveTag } = useTagContext();

  const filtered = useMemo(() => {
    return activeTag
      ? posts.filter((p) => p.frontmatter.tags?.includes(activeTag))
      : posts;
  }, [posts, activeTag]);

  function handleClick(tag?: string) {
    console.log('handleClick', tag);
    if (!tag || tag === activeTag) {
      setActiveTag(null);
    } else {
      setActiveTag(tag);
    }
  }

  return (
    <>
      {/* Sticky header: title + tag pills */}
      <div
        className='sticky top-0 z-10 pt-14 pb-6 -mx-4 sm:-mx-6 px-4 sm:px-6'
        style={{ background: 'var(--bg-color)' }}
      >
        <div className='flex items-center justify-between mb-5'>
          <h2 className='font-heading text-base font-semibold flex items-center gap-2'>
            <span className='w-1 h-4 rounded-full bg-gradient-to-b from-[var(--color-accent)] via-[var(--color-accent-violet)] to-[var(--color-accent-pink)]' />
            最新文章
          </h2>
          {activeTag && (
            <span className='text-xs text-muted-fg'>
              &ldquo;{activeTag}&rdquo; 标签 &middot; {filtered.length} 篇
            </span>
          )}
        </div>

        {tags.length > 0 && (
          <div className='flex flex-wrap gap-2'>
            <button
              onClick={() => handleClick()}
              className={`tag-pill cursor-pointer ${!activeTag ? 'active' : ''}`}
            >
              全部
            </button>
            {tags.map((tag) => {
              return (
                <button
                  key={tag}
                  onClick={() => handleClick(tag)}
                  className={`tag-pill cursor-pointer ${activeTag === tag ? 'active' : ''}`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Article grid */}
      <div className='grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2'>
        {filtered.length === 0 ? (
          <div className='col-span-full text-center py-16 text-muted-fg'>
            <p className='text-sm'>
              没有找到包含 &ldquo;{activeTag}&rdquo; 的文章
            </p>
          </div>
        ) : (
          filtered.map((post: PostMeta) => (
            <ArticleCard key={post.slug} post={post} />
          ))
        )}
      </div>
    </>
  );
}
