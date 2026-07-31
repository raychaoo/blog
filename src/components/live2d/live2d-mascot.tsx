"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    initWidget?: (options: Record<string, unknown>) => void;
  }
}

export default function Live2dMascot() {
  useEffect(() => {
    if (window.innerWidth < 768) return; // 桌面端显示
    let cancelled = false;

    const timer = window.setTimeout(
      () => {
        if (cancelled) return;

        const css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = "/live2d/waifu.css";

        const script = document.createElement("script");
        script.type = "module";
        script.src = "/live2d/waifu-tips.js";

        script.onload = () => {
          window.initWidget?.({
            waifuPath: "/live2d/waifu-tips.json",
            cdnPath: "/live2d-api/",
            cubism2Path: "/live2d/live2d.min.js",
            tools: ["hitokoto", "photo", "info", "quit"],
          });
        };
        document.head.append(css, script);
      },
      1500 // 延迟加载，避免影响首屏
    );

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  return null;
}
