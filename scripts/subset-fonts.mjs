// 字体子集化:读取 content/ + src/ 实际出现的字符,用 subset-font 生成
// ASCII / 内容字符两档 WOFF2,并生成 src/styles/fonts.css。
// 用法:pnpm fonts
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as fontkit from "fontkit";
import subsetFont from "subset-font";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const CONTENT_DIR = join(ROOT, "content");
const SRC_DIR_TEXT = join(ROOT, "src");
const SRC_DIR = join(ROOT, "assets", "fonts-src");
const TARGET_DIR = join(ROOT, "public", "fonts");
const FONTS = [
  { weight: 400, file: "AlibabaPuHuiTi-3-55-Regular.woff2", out: "puhuiti-400" },
  { weight: 500, file: "AlibabaPuHuiTi-3-65-Medium.woff2", out: "puhuiti-500" },
  { weight: 600, file: "AlibabaPuHuiTi-3-75-SemiBold.woff2", out: "puhuiti-600" },
  { weight: 700, file: "AlibabaPuHuiTi-3-85-Bold.woff2", out: "puhuiti-700" },
];

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.isFile()) files.push(full);
  }
  return files;
}

function collectText() {
  let text = "";
  const sourceFiles = walk(SRC_DIR_TEXT).filter(
    (f) => f.endsWith(".tsx") || f.endsWith(".ts") || f.endsWith(".mdx"),
  );
  const mdxFiles = walk(CONTENT_DIR).filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));
  for (const file of [...sourceFiles, ...mdxFiles]) {
    text += readFileSync(file, "utf8");
  }
  return text;
}

function toUnicodeRange(chars) {
  const cps = [...new Set(chars.map((c) => c.codePointAt(0)))].sort(
    (a, b) => a - b,
  );
  const parts = [];
  let start = null;
  let prev = null;
  for (const cp of cps) {
    if (start === null) {
      start = prev = cp;
      continue;
    }
    if (cp === prev + 1) {
      prev = cp;
      continue;
    }
    parts.push(start === prev ? `U+${start.toString(16).toUpperCase()}` : `U+${start.toString(16).toUpperCase()}-${prev.toString(16).toUpperCase()}`);
    start = prev = cp;
  }
  if (start !== null) {
    parts.push(start === prev ? `U+${start.toString(16).toUpperCase()}` : `U+${start.toString(16).toUpperCase()}-${prev.toString(16).toUpperCase()}`);
  }
  return parts.join(",");
}

async function subsetOne(buffer, chars, targetFormat = "woff2") {
  if (!chars.length) return Buffer.alloc(0);
  return subsetFont(buffer, [...new Set(chars)].join(""), { targetFormat });
}

async function main() {
  const text = collectText();
  const allChars = [...text].filter((c) => c.codePointAt(0) >= 0x20);
  const ascii = allChars.filter((c) => c.codePointAt(0) < 0x80);
  const contentCharsAll = allChars.filter((c) => c.codePointAt(0) >= 0x80);

  const declarations = [];
  for (const { weight, file, out } of FONTS) {
    const srcPath = join(SRC_DIR, file);
    if (!existsSync(srcPath)) {
      console.error(`[fonts] 缺少源字体:${srcPath}`);
      process.exit(1);
    }
    const buffer = readFileSync(srcPath);
    const fontChars = new Set([...fontkit.openSync(srcPath).characterSet]);
    const contentChars = contentCharsAll.filter((c) => fontChars.has(c.codePointAt(0)));
    const outDir = join(TARGET_DIR, out);
    mkdirSync(outDir, { recursive: true });

    const [asciiBuf, contentBuf] = await Promise.all([
      subsetOne(buffer, ascii),
      subsetOne(buffer, contentChars),
    ]);
    writeFileSync(join(outDir, "f0.woff2"), asciiBuf);
    writeFileSync(join(outDir, "f1.woff2"), contentBuf);

    declarations.push(
      `@font-face {`,
      `  font-family: "Alibaba PuHuiTi";`,
      `  src: url("/fonts/${out}/f0.woff2") format("woff2");`,
      `  font-weight: ${weight};`,
      `  font-style: normal;`,
      `  font-display: swap;`,
      `  unicode-range: ${toUnicodeRange(ascii)};`,
      `}`,
      `@font-face {`,
      `  font-family: "Alibaba PuHuiTi";`,
      `  src: url("/fonts/${out}/f1.woff2") format("woff2");`,
      `  font-weight: ${weight};`,
      `  font-style: normal;`,
      `  font-display: swap;`,
      `  unicode-range: ${toUnicodeRange(contentChars)};`,
      `}`,
    );
    console.log(
      `[fonts] ${out}: ascii ${asciiBuf.length} bytes, content ${contentBuf.length} bytes`,
    );
  }

  const css = declarations.join("\n") + "\n";
  writeFileSync(join(ROOT, "src", "styles", "fonts.css"), css);
  console.log("[fonts] src/styles/fonts.css 已生成");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
