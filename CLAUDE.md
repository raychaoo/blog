@AGENTS.md

# VibeCoding Blog

Personal tech blog built with Next.js 16 + React 19 + TypeScript + Tailwind CSS v4.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, TypeScript 5
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`), CSS custom properties
- **Content**: MDX via `unified` + `remark` + `rehype` pipeline (NOT `@next/mdx`)
- **Fonts**: `@fontsource/dm-sans` + `@fontsource/space-grotesk` (self-hosted, no Google Fonts API)
- **Search**: Fuse.js (client-side fuzzy search)
- **Icons**: Lucide React

## Architecture

```
content/posts/{slug}/index.mdx     # MDX articles with frontmatter
src/
├── app/
│   ├── layout.tsx                  # Root layout + BlogThemeProvider
│   ├── page.tsx                    # Homepage (article grid + sidebar)
│   ├── posts/[slug]/page.tsx       # Article detail page
│   ├── sitemap.ts                  # Auto-generated sitemap
│   ├── rss.xml/route.ts            # RSS feed
│   └── api/search/route.ts         # Search index API
├── components/
│   ├── header.tsx                  # Site header (server)
│   ├── theme-provider.tsx          # Multi-theme context provider
│   ├── theme-picker.tsx            # Theme selector dropdown
│   ├── search.tsx                  # Search modal (fuse.js)
│   ├── article-card.tsx            # Post card
│   ├── tag-filter.tsx              # Tag filter (client)
│   ├── toc.tsx                     # Table of contents (IntersectionObserver)
│   ├── progress-bar.tsx            # Reading progress (client)
│   ├── giscus.tsx                  # Giscus comments (lazy)
│   ├── giscus-dynamic.tsx          # Dynamic import wrapper
│   ├── code-enhancer.tsx           # Code block copy buttons
│   ├── liquid-bg.tsx               # Animated hero background
│   └── mdx-components.tsx          # MDX component map
├── lib/
│   ├── posts.ts                    # Parse frontmatter, list/filter posts
│   └── mdx.ts                      # MDX compile (unified pipeline)
└── styles/
    └── globals.css                 # All styles + 6 theme variables
```

## Theme System (Custom, no next-themes)

6 themes defined via `[data-theme="..."]` CSS attribute selectors:
- `light` — White background, indigo accent
- `dark` — Dark background, light indigo accent
- `sepia` — Warm cream, copper accent
- `ocean` — Navy dark, cyan accent
- `lavender` — Soft purple light, violet accent
- `midnight` — Very dark, emerald accent

Theme persisted to `localStorage("blog-theme")`. Anti-flash script in `<head>` reads it before hydration.

**Important**: All theme-dependent colors use CSS variables (`var(--bg-color)`, `var(--color-accent)`, etc.), NOT Tailwind theme tokens. `@theme inline` only defines `--color-destructive` and font families.

## Key Conventions

- **Server Components by default** — only add `"use client"` when needed (interactivity, browser APIs)
- **CSS variables** for theming, not Tailwind's `dark:` variant
- **Tailwind v4** uses `@import "tailwindcss"` and `@theme` — no `tailwind.config.ts`
- **MDX pipeline** uses `unified` (remark-parse → remark-gfm → remark-rehype → rehype-slug → rehype-autolink-headings → rehype-pretty-code → rehype-stringify)
- **Color system**: 6 accent colors (indigo, violet, pink, cyan, emerald, amber) cycle through tags and decorative elements

## Commands

```bash
pnpm dev       # Development server (hot reload)
pnpm build     # Production build
pnpm start     # Production server
```

## Dependencies

Key runtime: next, react, react-dom, @fontsource/dm-sans, @fontsource/space-grotesk, fuse.js, lucide-react, gray-matter, @giscus/react, unified ecosystem (remark-parse, remark-gfm, remark-rehype, rehype-slug, rehype-autolink-headings, rehype-pretty-code, rehype-stringify, unist-util-visit).

No `next-themes`, no `@next/mdx`, no `@mdx-js/mdx`.
