'use client';

import { useBlogTheme } from './theme-provider';
import { useEffect, useRef } from 'react';

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
  crossorigin: 'anonymous',
};


const LIGHT_THEMES = new Set(['light', 'sepia', 'lavender']);

export default function Giscus() {
  const { theme } = useBlogTheme();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
  }, [theme]);

  return <div ref={ref} className='comment-section mt-12 pt-8' />;
}
