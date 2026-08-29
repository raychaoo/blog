// 开发服务器启动器:3000 端口被占用时自动递增(3000 → 3001 → …)
import { spawn } from "node:child_process";
import { findFreePort } from "./find-port.mjs";

const port = await findFreePort((p) => console.log(`[dev] 端口 ${p} 被占用,尝试 ${p + 1} …`));
if (port === null) {
  console.error("[dev] 3000–3019 端口全部被占用,无法启动");
  process.exit(1);
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
