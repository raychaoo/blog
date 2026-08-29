// 共享端口探测:从 3000 起找第一个空闲端口,供 dev / start 启动器使用。
// Next.js 不像 Vite 有 strictPort:false 的自动递增行为,只能探测后显式传 -p。
import { createServer } from "node:net";

export const START_PORT = 3000;
export const MAX_TRIES = 20; // 最多尝试 3000–3019

// 监听 0.0.0.0 探测(next dev 默认绑 0.0.0.0,与 allowedDevOrigins 局域网访问一致)
function isPortFree(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => server.close(() => resolve(true)));
    server.listen(port, "0.0.0.0");
  });
}

// onOccupied(port) 在每个被占端口上回调,用于打印日志
export async function findFreePort(onOccupied) {
  for (let port = START_PORT; port < START_PORT + MAX_TRIES; port++) {
    if (await isPortFree(port)) return port;
    onOccupied?.(port);
  }
  return null;
}
