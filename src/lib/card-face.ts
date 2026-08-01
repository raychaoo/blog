export const CARD_FACE_WIDTH = 480;
export const CARD_FACE_HEIGHT = 724;

const LABEL = "VIBECODING · BLOG";

// CJK punctuation that should stay attached to the line it follows.
const PUNCT = /[，。、！？：；]/;

// Width heuristic in em: CJK ideographs, CJK symbols and fullwidth forms
// (U+3000–U+9FFF, U+FF00–U+FFEF) count 1em; latin, digits, spaces count 0.5em.
const CJK = /[　-鿿＀-￯]/;

// Vertical layout of the card face (SVG units). Content is centered within the
// safe area (inner rect 14..710) so the face reads balanced; the metal clip
// overlays only the very top of the texture.
const LABEL_Y = 145;
const NAME_Y = 295;
const DIVIDER_Y = 355;
const TAGLINE_START_Y = 425;
const TAGLINE_LINE_H = 44;
const INTRO_GAP = 46;
const INTRO_LINE_H = 40;

export interface CardFaceOptions {
  name: string;
  accent: string;
  tagline: string;
  intro: string;
}

/** Approximate char width in em units: CJK = 1, latin/digits/space = 0.5. */
export function textWidth(text: string): number {
  let w = 0;
  for (const ch of text) {
    w += CJK.test(ch) ? 1 : 0.5;
  }
  return w;
}

/**
 * Greedily wrap text into lines of at most `maxWidth` em. Words are first
 * packed at " · " boundaries so a separator never ends up dangling; any
 * single word still wider than maxWidth is sub-broken, preferring a clean
 * break right after a CJK punctuation mark that fits, else char by char.
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
    // Re-split any over-wide line until every piece fits within maxWidth.
    const queue = [l];
    while (queue.length) {
      const piece = queue.shift() as string;
      if (textWidth(piece) <= maxWidth) {
        result.push(piece);
        continue;
      }
      const split = subBreak(piece, maxWidth);
      if (split) queue.unshift(...split);
    }
  }
  return result;
}

/**
 * Split one over-wide line into two pieces. Prefer a clean break right after a
 * CJK punctuation mark whose leading prefix still fits within maxWidth, so the
 * punctuation stays attached to the clause that precedes it. Otherwise fall
 * back to a plain char-by-char greedy fill that stops before exceeding the
 * budget. Always returns a piece of width <= maxWidth as its left half.
 */
function subBreak(line: string, maxWidth: number): [string, string] | null {
  const chars = [...line];

  // Prefer a punctuation-anchored break: the last CJK punct that fits.
  let width = 0;
  let best = -1;
  for (let i = 0; i < chars.length; i++) {
    width += textWidth(chars[i]);
    if (PUNCT.test(chars[i]) && width <= maxWidth) best = i;
    if (width > maxWidth) break;
  }
  if (best !== -1) {
    return [chars.slice(0, best + 1).join(""), chars.slice(best + 1).join("")];
  }

  // Plain greedy fill, left half stays <= maxWidth.
  let left = "";
  for (const ch of chars) {
    if (left && textWidth(left) + textWidth(ch) > maxWidth) break;
    left += ch;
  }
  return [left, chars.slice(left.length).join("")];
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

  const introStartY = TAGLINE_START_Y + taglineLines.length * TAGLINE_LINE_H + INTRO_GAP;

  const taglineTexts = taglineLines
    .map((line, i) => textTag(240, TAGLINE_START_Y + i * TAGLINE_LINE_H, 22, "#cbd5e1", line))
    .join("");
  const introTexts = introLines
    .map((line, i) => textTag(240, introStartY + i * INTRO_LINE_H, 18, "#94a3b8", line))
    .join("");

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_FACE_WIDTH}" height="${CARD_FACE_HEIGHT}" viewBox="0 0 ${CARD_FACE_WIDTH} ${CARD_FACE_HEIGHT}">` +
    `<rect width="${CARD_FACE_WIDTH}" height="${CARD_FACE_HEIGHT}" rx="24" fill="#111827" opacity="0.92"/>` +
    `<rect x="14" y="14" width="${CARD_FACE_WIDTH - 28}" height="${CARD_FACE_HEIGHT - 28}" rx="18" fill="none" stroke="${escapeXml(accent)}" stroke-width="2" opacity="0.6"/>` +
    textTag(240, LABEL_Y, 20, escapeXml(accent), LABEL) +
    textTag(240, NAME_Y, 44, "#ffffff", `你好，我是 ${name}`) +
    `<line x1="140" y1="${DIVIDER_Y}" x2="340" y2="${DIVIDER_Y}" stroke="${escapeXml(accent)}" stroke-width="2" opacity="0.6"/>` +
    taglineTexts +
    introTexts +
    `</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
