@AGENTS.md

# VibeCoding Blog

Personal tech blog built with Next.js 16 + React 19 + TypeScript + Tailwind CSS v4.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, TypeScript 5
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`), CSS custom properties
- **Content**: MDX via `unified` + `remark` + `rehype` pipeline (NOT `@next/mdx`)
- **Fonts**: Alibaba PuHuiTi 3.0 (self-hosted WOFF2, no Google Fonts API)
- **Search**: Fuse.js (client-side fuzzy search)
- **Animations**: GSAP (@gsap/react) + Three.js / react-three-fiber (Lanyard)
- **UI library**: ReactBits (self-hosted/hand-typed components)
- **Icons**: Lucide React
- **Testing**: Vitest (run with Node; use jsdom@26 only when a DOM env is genuinely required)
- **Analytics**: @vercel/analytics

## Architecture

```
content/
├── posts/{slug}/index.mdx          # MDX articles with frontmatter
└── thoughts/{slug}/index.mdx       # 碎碎念念 (short thoughts) with frontmatter (title, date)
public/
├── fonts/                          # Self-hosted Alibaba PuHuiTi WOFF2 files
├── lanyard/                        # Lanyard card.glb + image assets
├── live2d/                         # Self-hosted live2d-widget v1 + Shizuku model (fully static)
└── live2d-api/                     # Self-hosted live2d API hub (waifu/model API fallback)
src/
├── app/
│   ├── layout.tsx                  # Root layout + BlogThemeProvider + sticky GooeyNav header + Live2dMascot
│   ├── page.tsx                    # Homepage (hero: Lanyard + profile card + stats; no post list / no search)
│   ├── posts/page.tsx              # /posts article grid (ChromaGrid header, tag filter, search, scroll restore)
│   ├── posts/[slug]/page.tsx       # Article detail page
│   ├── thoughts/page.tsx           # /thoughts timeline (OptionWheel filter, preview cards)
│   ├── thoughts/[slug]/page.tsx    # Thought detail page
│   ├── sitemap.ts                  # Auto-generated sitemap (/posts + /thoughts entries, force-static)
│   ├── rss.xml/route.ts            # RSS feed
│   └── api/search/route.ts         # Search index API
├── components/
│   ├── home/                       # home-client.tsx (client wrapper) + hero.tsx + github-contributions.tsx
│   ├── nav/header.tsx              # Site header (server) hosting GooeyNav
│   ├── live2d/live2d-mascot.tsx    # Global mascot (lazy-loaded from /live2d, 全屏宽,移动端画布 180px + 触摸拖动)
│   ├── mdx/                        # toc.tsx, progress-bar.tsx, giscus.tsx, giscus-dynamic.tsx, code-enhancer.tsx
│   ├── posts/                      # posts-client.tsx (search + tag filter + grid) + article-card.tsx
│   ├── thoughts/thoughts-client.tsx# Thought timeline client (filter + search)
│   ├── reactbits/                  # Self-hosted ReactBits: gooey-nav, lanyard, option-wheel, chroma-grid,
│   │                               #   split-text, text-type, shuffle, scroll-float
│   ├── search/search.tsx           # Search modal (fuse.js, shared across /posts & /thoughts)
│   └── theme/                      # theme-provider.tsx (context) + theme-picker.tsx (dropdown)
├── lib/
│   ├── posts.ts                    # Parse frontmatter, list/filter posts
│   ├── thoughts.ts                 # Parse thoughts frontmatter, list/sort, extractPreview
│   ├── accent-colors.ts            # useAccentColors()/readAccentColors() — reads theme accent CSS vars
│   └── mdx.ts                      # MDX compile (unified pipeline)
└── styles/
    └── globals.css                 # All styles + 6 theme variables
```

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Homepage — hero (Lanyard + profile card + GitHub stats/contributions), GooeyNav. No article list, no search box. |
| `/posts` | Article list — ChromaGrid glow header, tag filter pills, Fuse.js search, scroll position restore. |
| `/posts/[slug]` | Article detail — SplitText title, staggered meta fade-in, tag chips as `<span>`, Giscus comments, page transition. |
| `/thoughts` | 碎碎念念 — OptionWheel filter, timeline with entrance animations, 3-line preview cards, search hits. |
| `/thoughts/[slug]` | Thought detail — title animation, MDX render, Giscus comments, back link. |

## Layout

The site uses a **single global GooeyNav sticky header + full-width content** layout:

1. **Global header** (`src/components/nav/header.tsx`): sticky ReactBits GooeyNav with animated items linking to `/posts` and `/thoughts` (both Nav items).
2. **Homepage**: top-bottom hero (Lanyard 3D lanyard card + profile card + avatar/stats + GitHub contribution graph + about), full width. No sidebar, no post list, no search.
3. **Article / thought pages**: full-width content flow with an MDX table of contents (sticky on the right), reading progress bar on top, Giscus comments at the bottom.

No legacy sidebar. Profile content lives in the homepage hero card.

## Theme System (Custom, no next-themes)

6 themes defined via `[data-theme="..."]` CSS attribute selectors:
- `light` — White background, indigo accent
- `dark` — Dark background, light indigo accent
- `sepia` — Warm cream, copper accent
- `ocean` — Navy dark, cyan accent
- `lavender` — Soft purple light, violet accent
- `midnight` — Very dark, emerald accent

Theme persisted to `localStorage("blog-theme")`. Anti-flash script in `<head>` reads it (falls back to `prefers-color-scheme`) before hydration.

**Important**: All theme-dependent colors use CSS variables (`var(--bg-color)`, `var(--fg-color)`, `var(--color-accent)`, etc.), NOT Tailwind theme tokens. `@theme inline` only defines interactive/decoration tokens.

Each theme defines a **6-color accent family** as CSS vars:
`--color-accent` + `--color-accent-violet|pink|cyan|emerald|amber`.
Consumers read these at runtime via `useAccentColors()` / `readAccentColors()` from `@/lib/accent-colors` for JS-driven color props (GSAP particle colors, Three.js materials, ChromaGrid).

## Key Conventions

- **Server Components by default** — only add `"use client"` when needed (interactivity, browser APIs)
- **CSS variables** for theming, not Tailwind's `dark:` variant
- **Tailwind v4** uses `@import "tailwindcss"` and `@theme` — no `tailwind.config.ts`
- **Fonts**: Alibaba PuHuiTi 3.0 — self-hosted via `@font-face` in `globals.css`, `--font-sans` and `--font-heading` both use it
- **MDX pipeline** uses `unified` (remark-parse → remark-gfm → remark-rehype → rehype-slug → rehype-autolink-headings → rehype-pretty-code → rehype-stringify)
- **ReactBits 配色必须走 `useAccentColors`/CSS 变量** — never hardcode hex in animated components that should follow the theme; pass accent family / CSS vars down and re-render on theme change
- **Color system**: 6 accent colors (indigo/violet/pink/cyan/emerald/amber) cycle through tags and decorative elements via the theme accent CSS vars
- **Live2D is fully self-hosted & static** — no external CDN. The mascot lazy-loads `waifu-tips.js` + `waifu.css` from `/live2d` after 1.5s, draggable (mouse + touch), with `hitokoto`/`photo`/`info`/`quit` tools and 3 switchable models (shizuku/Pio/Tia); canvas shrinks to 180px below 768px.

## Commands

```bash
pnpm dev       # Development server (hot reload)
pnpm build     # Production build
pnpm start     # Production server
pnpm test      # Vitest run (unit tests for lib + search route)
pnpm lint      # ESLint (repo baseline is broken pre-existing; scope to touched files when in doubt)
```

## Dependencies

Key runtime: next, react, react-dom, @giscus/react, @vercel/analytics, fuse.js, lucide-react, gray-matter.

**Animation / 3D stack**: gsap, @gsap/react, three, @react-three/fiber, @react-three/drei, @react-three/rapier, meshline.

**MDX / content**: unified ecosystem (remark-parse, remark-gfm, remark-rehype, rehype-slug, rehype-autolink-headings, rehype-pretty-code, rehype-stringify, unist-util-visit).

**Dev / test**: vitest, jsdom (^26 — pinned; only add `environment: "jsdom"` when a component truly needs a DOM, otherwise keep the Node env).

No `next-themes`, no `@next/mdx`, no `@mdx-js/mdx`, no `@fontsource/*`.
