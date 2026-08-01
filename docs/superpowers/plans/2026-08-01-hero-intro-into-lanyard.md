# Hero Intro into Lanyard Card — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bake all hero intro content (label, name, tagline, short intro) into the Lanyard 3D card front texture and turn the hero into a single centered, enlarged Lanyard.

**Architecture:** A pure `buildCardFrontSvg()` function in `src/lib/card-face.ts` renders a 480×724 SVG (matching the card front UV aspect ≈ 0.66, verified from `card.glb` atlas 1678×1677) as a data-URL `frontImage`. `hero.tsx` drops the DOM copy block and passes a larger `cardScale` to the Lanyard; the Lanyard component gains a `cardScale` prop that scales collider + meshes together (rapier supports scaled parent groups).

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind v4, three/react-three-fiber/@react-three/rapier, Vitest (node env).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-01-hero-intro-into-lanyard-design.md`
- Card front texture is left half of the 1678×1677 atlas; front UV rect `{x:0, y:0, w:0.5, h:0.755}` → aspect ≈ 0.66. The SVG must be 480×724 so `imageFit="cover"` shows it uncropped.
- Card top has a metal clip/clamp mesh — SVG keeps ≥ 40px top margin.
- Theme colors go through CSS variables / `useAccentColors()` — the SVG accent is a parameter, never a hardcoded hex in `hero.tsx`.
- Chinese copy is fixed (from spec), used verbatim:
  - label: `VIBECODING · BLOG`
  - name line: `你好，我是 {name}`
  - tagline: `全栈开发者 · 热爱 React 与 TypeScript · 记录技术学习与思考`
  - intro: `记录前端工程化、React 生态与开发效率的实践，有长文，也有碎碎念念。`
- Tests: Vitest, `include: ["src/**/*.test.ts"]`, node env by default, `@` → `src` alias. New tests go in `src/lib/__tests__/`. Do NOT add `@vitest-environment jsdom` unless the test genuinely needs a DOM (card-face tests don't).
- `name` comes from the GitHub API (user-controlled) — must be XML-escaped in the SVG.
- `pnpm lint` repo baseline is broken; scope lint to touched files only.
- AGENTS.md: this is Next 16 with breaking changes — if a step needs a new Next.js API, read `node_modules/next/dist/docs/` first. (This plan uses no new Next APIs.)

---

### Task 1: `card-face.ts` pure module + unit tests (TDD)

**Files:**
- Create: `src/lib/card-face.ts`
- Test: `src/lib/__tests__/card-face.test.ts`

**Interfaces:**
- Produces (used by Task 3):
  - `export interface CardFaceOptions { name: string; accent: string; tagline: string; intro: string }`
  - `export function buildCardFrontSvg(options: CardFaceOptions): string` — returns `data:image/svg+xml;charset=utf-8,` URL of a 480×724 SVG
  - `export function wrapLines(text: string, maxWidth: number): string[]` — greedy wrap, CJK char = 1 width unit, others = 0.5; never breaks inside a ` · ` separator sequence; CJK punctuation (`，。、！？：；`) never triggers a break.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/__tests__/card-face.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildCardFrontSvg, wrapLines } from "../card-face";

const TAGLINE = "全栈开发者 · 热爱 React 与 TypeScript · 记录技术学习与思考";
const INTRO = "记录前端工程化、React 生态与开发效率的实践，有长文，也有碎碎念念。";

function decodeSvg(url: string): string {
  const prefix = "data:image/svg+xml;charset=utf-8,";
  expect(url.startsWith(prefix)).toBe(true);
  return decodeURIComponent(url.slice(prefix.length));
}

describe("wrapLines", () => {
  it("keeps ' · ' separators attached and wraps the tagline into two lines", () => {
    expect(wrapLines(TAGLINE, 20)).toEqual([
      "全栈开发者 · 热爱 React 与 TypeScript",
      "记录技术学习与思考",
    ]);
  });

  it("breaks CJK runs at maxWidth without splitting a trailing fullwidth comma", () => {
    expect(wrapLines(INTRO, 23)).toEqual([
      "记录前端工程化、React 生态与开发效率的实践，",
      "有长文，也有碎碎念念。",
    ]);
  });

  it("sub-breaks a single word longer than maxWidth", () => {
    expect(wrapLines("一二三四五六七八九十", 5)).toEqual(["一二三四五", "六七八九十"]);
  });
});

describe("buildCardFrontSvg", () => {
  it("returns a 480x724 SVG data URL", () => {
    const url = buildCardFrontSvg({ name: "koko", accent: "#6366f1", tagline: TAGLINE, intro: INTRO });
    const svg = decodeSvg(url);
    expect(svg).toContain('width="480"');
    expect(svg).toContain('height="724"');
    expect(svg).toContain('viewBox="0 0 480 724"');
  });

  it("contains label, name, tagline and intro text", () => {
    const url = buildCardFrontSvg({ name: "koko", accent: "#6366f1", tagline: TAGLINE, intro: INTRO });
    const svg = decodeSvg(url);
    expect(svg).toContain("VIBECODING · BLOG");
    expect(svg).toContain("你好，我是 koko");
    expect(svg).toContain("全栈开发者 · 热爱 React 与 TypeScript");
    expect(svg).toContain("记录技术学习与思考");
    expect(svg).toContain("有长文，也有碎碎念念。");
  });

  it("uses the provided accent for stroke and label", () => {
    const url = buildCardFrontSvg({ name: "koko", accent: "#ff0044", tagline: TAGLINE, intro: INTRO });
    const svg = decodeSvg(url);
    expect(svg).toContain('#ff0044');
  });

  it("XML-escapes user-controlled name (GitHub API input)", () => {
    const url = buildCardFrontSvg({ name: '"><script>alert(1)</script>', accent: "#6366f1", tagline: TAGLINE, intro: INTRO });
    const svg = decodeSvg(url);
    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;script&gt;");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test`
Expected: FAIL — `Failed to resolve import "../card-face"` / module not found.

- [ ] **Step 3: Write the implementation**

Create `src/lib/card-face.ts`:

```ts
export const CARD_FACE_WIDTH = 480;
export const CARD_FACE_HEIGHT = 724;

const LABEL = "VIBECODING · BLOG";

// CJK punctuation that should stay attached to the line it follows.
const PUNCT = /[，。、！？：；]/;

export interface CardFaceOptions {
  name: string;
  accent: string;
  tagline: string;
  intro: string;
}

/** Approximate char width in em units: CJK = 1, latin/digits/space = 0.5. */
function textWidth(text: string): number {
  let w = 0;
  for (const ch of text) {
    w += /[\u3000-\u9fff\uff00-\uffef]/.test(ch) ? 1 : 0.5;
  }
  return w;
}

/**
 * Greedily wrap text into lines of at most `maxWidth` em. Words are first
 * packed at " · " boundaries so a separator never ends up dangling; any
 * single word still wider than maxWidth is sub-broken char by char, with
 * CJK punctuation never triggering the break.
 */
export function wrapLines(text: string, maxWidth: number): string[] {
  const words = text.split(" · ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} · ${word}` : word;
    if (line && textWidth(candidate) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);

  const result: string[] = [];
  for (const l of lines) {
    if (textWidth(l) <= maxWidth) {
      result.push(l);
      continue;
    }
    let buf = "";
    for (const ch of l) {
      if (buf && !PUNCT.test(ch) && !buf.endsWith("·") && textWidth(buf) + textWidth(ch) > maxWidth) {
        result.push(buf);
        buf = "";
      }
      buf += ch;
    }
    if (buf) result.push(buf);
  }
  return result;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function textTag(
  x: number,
  y: number,
  fontSize: number,
  fill: string,
  content: string
): string {
  return (
    `<text x="${x}" y="${y}" text-anchor="middle" font-family="sans-serif" font-size="${fontSize}" fill="${fill}">` +
    escapeXml(content) +
    `</text>`
  );
}

export function buildCardFrontSvg({ name, accent, tagline, intro }: CardFaceOptions): string {
  const taglineLines = wrapLines(tagline, 20);
  const introLines = wrapLines(intro, 23);

  const taglineStartY = 370;
  const taglineLineH = 44;
  const introStartY = taglineStartY + taglineLines.length * taglineLineH + 46;
  const introLineH = 40;

  const taglineTexts = taglineLines
    .map((line, i) => textTag(240, taglineStartY + i * taglineLineH, 22, "#cbd5e1", line))
    .join("");
  const introTexts = introLines
    .map((line, i) => textTag(240, introStartY + i * introLineH, 18, "#94a3b8", line))
    .join("");

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_FACE_WIDTH}" height="${CARD_FACE_HEIGHT}" viewBox="0 0 ${CARD_FACE_WIDTH} ${CARD_FACE_HEIGHT}">` +
    `<rect width="${CARD_FACE_WIDTH}" height="${CARD_FACE_HEIGHT}" rx="24" fill="#111827" opacity="0.92"/>` +
    `<rect x="14" y="14" width="${CARD_FACE_WIDTH - 28}" height="${CARD_FACE_HEIGHT - 28}" rx="18" fill="none" stroke="${escapeXml(accent)}" stroke-width="2" opacity="0.6"/>` +
    textTag(240, 90, 20, accent, LABEL) +
    textTag(240, 240, 44, "#ffffff", `你好，我是 ${name}`) +
    `<line x1="140" y1="300" x2="340" y2="300" stroke="${escapeXml(accent)}" stroke-width="2" opacity="0.6"/>` +
    taglineTexts +
    introTexts +
    `</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test`
Expected: PASS — all tests in `src/lib/__tests__/card-face.test.ts` green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/card-face.ts src/lib/__tests__/card-face.test.ts
git commit -m "feat: add card-face SVG generator with line wrapping and escaping
Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: `lanyard.tsx` — add `cardScale` prop

**Files:**
- Modify: `src/components/reactbits/lanyard.tsx` (props interfaces ~L47-57, ~L132-141; Band destructure ~L147-156; card RigidBody JSX ~L310-343)

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces (used by Task 3): `LanyardProps.cardScale?: number` (default `2.25`) — passed through `Lanyard` → `Band`; the scale factor is applied to a `<group>` wrapping BOTH the CuboidCollider and the meshes inside the card `RigidBody`, so collider and visuals scale together (rapier supports scaled parent groups). Default 2.25 keeps today's exact rendering.

- [ ] **Step 1: Add `cardScale` to `LanyardProps` and thread it to `Band`**

In the `LanyardProps` interface (currently at ~line 47), add `cardScale?: number;`. In the `Lanyard` function signature's destructuring (currently ~line 59-69), add `cardScale = 2.25,` and compute a mobile-reduced value; pass both to `Band`:

```tsx
const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth < 768);
...
const scaled = isMobile ? cardScale * 0.8 : cardScale;
```

and in the `<Band ... />` JSX (currently ~line 88-95) add `cardScale={scaled}`.

- [ ] **Step 2: Add `cardScale` to `BandProps` and destructure it**

In `BandProps` (currently ~line 132) add `cardScale?: number;`. In the `Band` function destructuring (currently ~line 147-156) add `cardScale = 2.25,`.

- [ ] **Step 3: Move the scale to wrap collider + meshes**

Replace the card `RigidBody` block (currently ~lines 310-343). The change: remove `scale={2.25}` from the inner `<group position={[0, -1.2, -0.05]} ...>` and wrap the collider + that group in `<group scale={cardScale}>`:

```tsx
<RigidBody
  position={[2, 0, 0]}
  ref={card}
  {...segmentProps}
  type={dragged ? 'kinematicPosition' : 'dynamic'}
>
  <group scale={cardScale}>
    <CuboidCollider args={[0.8, 1.125, 0.01]} />
    <group
      position={[0, -1.2, -0.05]}
      onPointerOver={() => hover(true)}
      onPointerOut={() => hover(false)}
      onPointerUp={(e: ThreeEvent<PointerEvent>) => {
        (e.target as Element).releasePointerCapture(e.pointerId);
        drag(false);
      }}
      onPointerDown={(e: ThreeEvent<PointerEvent>) => {
        (e.target as Element).setPointerCapture(e.pointerId);
        drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())));
      }}
    >
      <mesh geometry={nodes.card.geometry}>
        <meshPhysicalMaterial
          map={cardMap}
          map-anisotropy={16}
          clearcoat={isMobile ? 0 : 1}
          clearcoatRoughness={0.15}
          roughness={0.9}
          metalness={0.8}
        />
      </mesh>
      <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
      <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
    </group>
  </group>
</RigidBody>
```

(Keep all existing attributes; the only edits are the removed `scale={2.25}` and the added outer `<group scale={cardScale}>`.)

- [ ] **Step 4: Verify it compiles**

Run: `pnpm exec tsc --noEmit`
Expected: no type errors. (If `tsc` is unavailable as a script, `npx tsc --noEmit` — it resolves from the pnpm store.)

- [ ] **Step 5: Commit**

```bash
git add src/components/reactbits/lanyard.tsx
git commit -m "feat: add cardScale prop to lanyard, scale collider and meshes together
Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: `hero.tsx` rewrite + `globals.css` layout

**Files:**
- Modify: `src/components/home/hero.tsx` (whole file, ~75 lines)
- Modify: `src/styles/globals.css` (`hero-section` / `hero-lanyard` / `hero-tagline` / `hero-intro` rules, currently ~lines 775-795)

**Interfaces:**
- Consumes:
  - Task 1: `buildCardFrontSvg({ name, accent, tagline, intro }): string` from `@/lib/card-face`
  - Task 2: `<Lanyard frontImage={...} cardScale={3.4} position={[0, 0, 30]} gravity={[0, -40, 0]} fov={20} />`
- Produces: nothing (leaf task).

- [ ] **Step 1: Rewrite `hero.tsx`**

Replace the entire file content with:

```tsx
"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { buildCardFrontSvg } from "@/lib/card-face";
import { useAccentColors } from "@/lib/accent-colors";

const Lanyard = dynamic(() => import("@/components/reactbits/lanyard"), {
  ssr: false,
  loading: () => null,
});

const TAGLINE = "全栈开发者 · 热爱 React 与 TypeScript · 记录技术学习与思考";
const INTRO = "记录前端工程化、React 生态与开发效率的实践，有长文，也有碎碎念念。";

interface HeroProps {
  name: string;
}

export default function Hero({ name }: HeroProps) {
  const colors = useAccentColors();
  const cardFront = useMemo(
    () => buildCardFrontSvg({ name, accent: colors.accent, tagline: TAGLINE, intro: INTRO }),
    [name, colors.accent]
  );

  return (
    <section className="hero-section">
      <div className="hero-lanyard">
        <Lanyard frontImage={cardFront} cardScale={3.4} position={[0, 0, 30]} gravity={[0, -40, 0]} fov={20} />
      </div>
    </section>
  );
}
```

This removes `SplitText`, `TextType`, `Shuffle` imports/usage and the old inline `buildCardFrontSvg` (it moves to `src/lib/card-face.ts`).

- [ ] **Step 2: Update `globals.css`**

Replace the current hero rules (grid two-column at ~775-789, tagline/intro margins at ~790-795) with:

```css
.hero-section {
  display: block;
}
.hero-lanyard {
  height: clamp(480px, calc(100dvh - 56px), 880px);
  min-height: 480px;
}
```

(Delete the `.hero-tagline` and `.hero-intro` blocks entirely — nothing references them anymore. Keep `.btn-press` and everything after untouched.)

- [ ] **Step 3: Verify no stale references**

Run: `pnpm exec tsc --noEmit`
Expected: no errors. Also grep to confirm nothing else uses the removed CSS classes:

Run: `pnpm exec eslint src/components/home/hero.tsx src/lib/card-face.ts`
Expected: clean or only pre-existing baseline issues. (Repo lint baseline is broken; if eslint reports unrelated pre-existing errors, note them and move on.)

- [ ] **Step 4: Commit**

```bash
git add src/components/home/hero.tsx src/styles/globals.css
git commit -m "feat: bake hero intro into lanyard card, single centered hero layout
Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Full verification (tests + build + manual dev pass)

**Files:** none (verification only)

- [ ] **Step 1: Run the test suite**

Run: `pnpm test`
Expected: all tests pass (including new `card-face` tests).

- [ ] **Step 2: Production build**

Run: `pnpm build`
Expected: build completes with no errors.

- [ ] **Step 3: Manual dev pass**

Run: `pnpm dev`, open http://localhost:3000 (desktop width), check:

- [ ] Hero is a single centered Lanyard, no leftover DOM copy text
- [ ] Card front shows: `VIBECODING · BLOG` label (accent color), `你好，我是 {name}` (white, bold), accent divider line, two tagline lines (gray), two intro lines (dimmer gray)
- [ ] Text is readable at desktop size (card enlarged vs before)
- [ ] Card swings within the canvas (no clipping at the top/edges) and settles near center
- [ ] Dragging the card still works; grab/grabbing cursors behave
- [ ] Switching theme (light/dark/sepia/ocean/lavender/midnight) recolors the accent border/label/divider on the card
- [ ] Mobile width (~390px): card centered, no horizontal overflow, text legible

**If the card is too small / too large or swings out of view**, tune in `hero.tsx` only: `cardScale` (3.4 baseline) and, if needed, `fov` (20 baseline, raise toward 24 to fit more vertical swing). Do not chase pixel perfection — reasonable bounds are fine.

- [ ] **Step 4: Commit any tuning tweaks**

```bash
git add src/components/home/hero.tsx
git commit -m "tweak: tune lanyard card scale for hero readability
Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

(Only run this step if Step 3 produced tuning changes.)
