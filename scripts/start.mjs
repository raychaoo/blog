// 生产预览启动器:本仓库是 output:'export' 静态导出,next start 不适用
// ("next start" does not work with "output: export" configuration)。
// 这里用零依赖静态服务器跑 out/,3000 被占用时自动递增(3000 → 3001 → …)。
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";
import { findFreePort } from "./find-port.mjs";

const ROOT = resolve(process.cwd(), "out");

if (!existsSync(join(ROOT, "index.html"))) {
  console.error("[start] 未找到 out/index.html,请先执行 pnpm build");
  process.exit(1);
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".glb": "model/gltf-binary",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".wasm": "application/wasm",
};

// 把 URL 路径解析成 out/ 内的安全绝对路径;找不到返回 null
function resolveFile(urlPath) {
  let pathname;
  try {
    pathname = decodeURIComponent(urlPath.split("?")[0]);
  } catch {
    return null; // 畸形百分号编码
  }
  const resolved = normalize(join(ROOT, pathname));
  // 防目录穿越:解析结果必须仍在 out/ 内
  if (resolved !== ROOT && !resolved.startsWith(ROOT + sep)) return null;

  if (statSync(resolved, { throwIfNoEntry: false })?.isFile()) return resolved;
  // 目录 → 其下 index.html(根路径 / → out/index.html)
  const dirIndex = join(resolved, "index.html");
  if (statSync(dirIndex, { throwIfNoEntry: false })?.isFile()) return dirIndex;
  // 无扩展名路由 → Next 导出形态 {slug}.html(/posts/foo → out/posts/foo.html)
  if (!extname(resolved)) {
    const html = resolved + ".html";
    if (statSync(html, { throwIfNoEntry: false })?.isFile()) return html;
  }
  return null;
}

function serveFile(req, res, filePath, status = 200) {
  const stat = statSync(filePath);
  const type = MIME[extname(filePath).toLowerCase()] ?? "application/octet-stream";
  // /_next/static 带内容哈希,可永久缓存;html 不缓存保证预览最新
  const cache = filePath.includes(`${sep}_next${sep}static${sep}`)
    ? "public, max-age=31536000, immutable"
    : type.startsWith("text/html")
      ? "no-cache"
      : "public, max-age=3600";

  const headers = { "Content-Type": type, "Cache-Control": cache, "Accept-Ranges": "bytes" };

  // 单段 Range(视频/音频拖动进度条用),如 bytes=100- / bytes=100-999
  const range = req.headers.range?.match(/^bytes=(\d*)-(\d*)$/);
  if (range && (range[1] || range[2])) {
    let start, end;
    if (range[1] === "") {
      // 后缀形式 bytes=-N:最后 N 字节
      start = Math.max(stat.size - Number(range[2]), 0);
      end = stat.size - 1;
    } else {
      start = Number(range[1]);
      end = range[2] === "" ? stat.size - 1 : Math.min(Number(range[2]), stat.size - 1);
    }
    if (start > end || start >= stat.size) {
      res.writeHead(416, { "Content-Range": `bytes */${stat.size}` });
      return res.end();
    }
    res.writeHead(206, { ...headers, "Content-Range": `bytes ${start}-${end}/${stat.size}`, "Content-Length": end - start + 1 });
    if (req.method === "HEAD") return res.end();
    return createReadStream(filePath, { start, end }).pipe(res);
  }

  res.writeHead(status, { ...headers, "Content-Length": stat.size });
  if (req.method === "HEAD") return res.end();
  createReadStream(filePath).pipe(res);
}

const port = await findFreePort((p) => console.log(`[start] 端口 ${p} 被占用,尝试 ${p + 1} …`));
if (port === null) {
  console.error("[start] 3000–3019 端口全部被占用,无法启动");
  process.exit(1);
}

createServer((req, res) => {
  const file = resolveFile(req.url ?? "/");
  if (file) return serveFile(req, res, file);
  // 未命中 → 404 页(Next 导出自带 out/404.html)
  const notFound = join(ROOT, "404.html");
  if (statSync(notFound, { throwIfNoEntry: false })?.isFile()) {
    return serveFile(req, res, notFound, 404);
  }
  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("404 Not Found");
}).listen(port, "0.0.0.0", () => {
  console.log(`▲ 静态预览(out/)已启动:`);
  console.log(`- Local:   http://localhost:${port}`);
});
