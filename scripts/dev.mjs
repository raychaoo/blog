// 开发服务器启动器:3000 端口被占用时自动递增(3000 → 3001 → ...)
// Next.js 不像 Vite 有 strictPort:false 的自动递增行为,只能探测后显式传 -p。
import { spawn } from "node:child_process";
import { createServer } from "node:net";

const START_PORT = 3000;
const MAX_TRIES = 20; // 最多尝试 3000–3019

// 监听 0.0.0.0 探测(next dev 默认绑 0.0.0.0,与 allowedDevOrigins 局域网访问一致)
function isPortFree(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => server.close(() => resolve(true)));
    server.listen(port, "0.0.0.0");
  });
}

for (let port = START_PORT; port < START_PORT + MAX_TRIES; port++) {
  if (!(await isPortFree(port))) {
    console.log(`[dev] 端口 ${port} 被占用,尝试 ${port + 1} …`);
    continue;
  }
  const child = spawn("next", ["dev", "-p", String(port)], {
    stdio: "inherit",
    // Windows 上 .cmd 需要通过 shell 解析(pnpm 脚本环境)
    shell: process.platform === "win32",
  });
  child.on("exit", (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    else process.exit(code ?? 0);
  });
  break;
}
