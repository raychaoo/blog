# Changelog

## [Unreleased]

### Added
- **Blog framework**: Next.js 16 App Router with React 19 and TypeScript
- **Content pipeline**: MDX articles via unified/remark/rehype with frontmatter parsing
- **Theme system**: 6 themes (light, dark, sepia, ocean, lavender, midnight) with localStorage persistence and anti-flash script
- **Article pages**: Dynamic routing, tag pills, reading time estimation, cover images
- **Homepage**: Article grid with tag filtering and sidebar (post count, tag cloud, copyright)
- **Search**: Client-side fuzzy search via Fuse.js with ⌘K shortcut and modal UI
- **Comments**: Giscus integration with dynamic import for code splitting
- **Code blocks**: Syntax highlighting with rehype-pretty-code and copy-button injection
- **Table of contents**: IntersectionObserver-based TOC sidebar on article pages
- **Reading progress bar**: Fixed top progress indicator
- **RSS feed**: Auto-generated `/rss.xml` from all posts
- **Sitemap**: Auto-generated `sitemap.ts`
- **Search API**: JSON endpoint (`/api/search`) for client-side search index
- **MDX posts**: 5 articles covering Next.js, React 19, Ant Design patterns, and blog development
- **Typography**: DM Sans + Space Grotesk self-hosted via Fontsource
- **Icons**: Lucide React icon set

### Changed
- Enhanced `next.config.ts` with MDX file handling and image configuration
- Extended `package.json` with full dependency set for MDX pipeline, search, and UI
- Updated root layout with theme provider, progress bar, and site header
- Refactored homepage to use client/server component split pattern

### Removed
- Deleted unused components: `code-copy.tsx`, `main-content.tsx`, `liquid-bg.tsx`
- Removed orphaned `.liquid-blob` CSS animations from `globals.css`
- Cleaned up default Next.js globals.css
