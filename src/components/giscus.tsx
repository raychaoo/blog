'use client';

import { useBlogTheme } from './theme-provider';
import { useEffect, useState, useRef } from 'react';

const GISCUS_CONFIG: Record<string, string> = {
  src: 'https://giscus.app/client.js',
  'data-repo': 'raychaoo/blog',
  'data-repo-id': 'R_kgDOSjgfXQ',
  'data-category': 'General',
  'data-category-id': 'DIC_kwDOSjgfXc4C92Lr',
  'data-mapping': 'pathname',
  'data-strict': '0',
  'data-reactions-enabled': '1',
  'data-emit-metadata': '0',
  'data-input-position': 'top',
  'data-lang': 'zh-CN',
  'data-loading': 'lazy',
  crossorigin: 'anonymous',
};

const LIGHT_THEMES = new Set(['light', 'sepia', 'lavender']);

export default function Giscus() {
  const { theme } = useBlogTheme();
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observerRef.current?.disconnect();
        }
      },
      { rootMargin: '200px' },
    );

    if (ref.current) {
      observerRef.current.observe(ref.current);
    }

    return () => observerRef.current?.disconnect();
  }, [mounted]);

  useEffect(() => {
    if (!visible) return;

    const existing = document.querySelector('.giscus-frame');
    if (existing) existing.remove();

    const script = document.createElement('script');
    Object.entries(GISCUS_CONFIG).forEach(([key, value]) => {
      script.setAttribute(key, value);
    });
    script.setAttribute(
      'data-theme',
      LIGHT_THEMES.has(theme) ? 'light' : 'dark',
    );

    ref.current?.appendChild(script);

    return () => {
      const existingScript = document.querySelector(
        'script[src="https://giscus.app/client.js"]',
      );
      if (existingScript) existingScript.remove();
    };
  }, [visible, theme]);

  if (!mounted) {
    return <div className='h-20' />;
  }

  return (
    <div ref={ref} className='comment-section mt-12 pt-8'>
      {!visible && (
        <div className='text-center text-muted-fg text-sm py-8'>
          评论加载中...
        </div>
      )}
    </div>
  );
}
