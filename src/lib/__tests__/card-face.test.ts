import { describe, it, expect } from "vitest";
import { buildCardFrontSvg, textWidth, wrapLines } from "../card-face";

const TAGLINE = "全栈开发者 · 热爱 React 与 TypeScript · 记录技术学习与思考";
const INTRO = "记录前端工程化、React 生态与开发效率的实践，有长文，也有碎碎念。";

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
      "有长文，也有碎碎念。",
    ]);
  });

  it("sub-breaks a single word longer than maxWidth", () => {
    expect(wrapLines("一二三四五六七八九十", 5)).toEqual(["一二三四五", "六七八九十"]);
  });
});

describe("wrapLines width invariant", () => {
  const corpus = [
    "TypeScript",
    "全栈开发者 · 热爱 React 与 TypeScript · 记录技术学习与思考",
    "记录前端工程化、React 生态与开发效率的实践，有长文，也有碎碎念。",
    "一二三四五六七八九十",
    "a b c d e f g",
    "，，，，，，，，，，，，，，",
  ];
  for (const text of corpus) {
    for (const maxWidth of [1, 5, 20, 23]) {
      it(`wraps ${JSON.stringify(text.slice(0, 12))}… at maxWidth ${maxWidth} without exceeding it`, () => {
        const lines = wrapLines(text, maxWidth);
        expect(lines.length).toBeGreaterThan(0);
        for (const line of lines) {
          expect(textWidth(line)).toBeLessThanOrEqual(maxWidth);
        }
      });
    }
  }
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
    expect(svg).toContain("有长文，也有碎碎念。");
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

  it("defaults to the dark face palette", () => {
    const url = buildCardFrontSvg({ name: "koko", accent: "#6366f1", tagline: TAGLINE, intro: INTRO });
    const svg = decodeSvg(url);
    expect(svg).toContain('fill="#111827"');
    expect(svg).toContain('fill="#ffffff"');
  });

  it("adapts face background and foreground to the provided palette", () => {
    const url = buildCardFrontSvg({
      name: "koko",
      accent: "#6366f1",
      tagline: TAGLINE,
      intro: INTRO,
      bg: "#fbfaf8",
      fg: "#1c1917",
    });
    const svg = decodeSvg(url);
    expect(svg).toContain('fill="#fbfaf8"');
    expect(svg).toContain('fill="#1c1917"');
    // 默认深色底不应再出现
    expect(svg).not.toContain('fill="#111827"');
  });
});
