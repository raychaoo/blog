"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    initWidget?: (options: Record<string, unknown>) => void;
  }
}

const POSITION_KEY = "waifu-position";

// 模块级 flag:防 React StrictMode 开发模式双挂载导致的重复绑定
let bound = false;

export default function Live2dMascot() {
  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(
      () => {
        if (cancelled) return;

        const css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = "/live2d/waifu.css";

        // 看板娘默认贴右下角:与 waifu.css 同特异性(ID)且后注入,覆盖其 left: 0;
        // 刻意不用 !important,让拖拽/restore 写入的内联 left 按级联优先于样式表规则
        const style = document.createElement("style");
        style.textContent = "#waifu { left: auto; right: 0; }";

        const script = document.createElement("script");
        script.type = "module";
        script.src = "/live2d/waifu-tips.js";

        script.onload = () => {
          window.initWidget?.({
            waifuPath: "/live2d/waifu-tips.json",
            cdnPath: "/live2d-api/",
            cubism2Path: "/live2d/live2d.min.js",
            tools: ["hitokoto", "switch-model", "photo", "info", "quit"],
            drag: true,
          });
          bindPositionPersistence();
        };
        document.head.append(css, script, style);
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

/** 看板娘拖动位置持久化:恢复 + 保存 + 触摸拖动 */
function bindPositionPersistence() {
  if (bound) return;
  bound = true;

  // 读取保存的位置;缺失或解析失败(值损坏)返回 null,回退默认位置
  const readSaved = (): { top: number; left: number } | null => {
    try {
      const raw = localStorage.getItem(POSITION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { top?: unknown; left?: unknown };
      if (typeof parsed.top !== "number" || typeof parsed.left !== "number") {
        return null;
      }
      return { top: parsed.top, left: parsed.left };
    } catch {
      return null;
    }
  };

  // 保存当前位置;首次拖动前 style.top/left 为空字符串,跳过
  const save = () => {
    const waifu = document.getElementById("waifu");
    if (!waifu) return;
    const { top, left } = waifu.style;
    if (!top.endsWith("px") || !left.endsWith("px")) return;
    // 内联锚定生效后清掉样式表的右/下锚,防止双锚把元素拉伸成整条透明带
    waifu.style.right = "auto";
    waifu.style.bottom = "auto";
    localStorage.setItem(
      POSITION_KEY,
      JSON.stringify({ top: parseFloat(top), left: parseFloat(left) })
    );
  };

  // 恢复位置,按内置拖动同款公式对当前视口钳制
  const restore = (waifu: HTMLElement) => {
    const saved = readSaved();
    if (!saved) return;
    waifu.style.bottom = "auto"; // 覆盖 bottom:0,防止固定定位高度被拉伸,保证 offsetHeight 为内容高度
    waifu.style.right = "auto"; // 覆盖样式表 right: 0,防止水平双锚拉伸
    const maxLeft = Math.max(0, window.innerWidth - waifu.offsetWidth);
    const maxTop = Math.max(0, window.innerHeight - waifu.offsetHeight);
    waifu.style.left = `${Math.min(Math.max(saved.left, 0), maxLeft)}px`;
    waifu.style.top = `${Math.min(Math.max(saved.top, 0), maxTop)}px`;
  };

  // 触摸拖动(移动端):内置拖动只监听鼠标事件,这里补 touch 等效实现
  const bindTouchDrag = (waifu: HTMLElement) => {
    const canvas = document.getElementById("live2d");
    if (!canvas) return;
    canvas.addEventListener("mousedown", () => {
      // 已有内联 left 时才清右/下锚(防双锚拉伸);无内联 left 时全 auto 会把元素瞬移到文档末尾
      if (!waifu.style.left) return;
      waifu.style.right = "auto";
      waifu.style.bottom = "auto";
    });
    canvas.addEventListener(
      "touchstart",
      (e: TouchEvent) => {
        if (e.touches.length !== 1) return;
        waifu.style.bottom = "auto"; // 防止拉伸:保证本帧起 offsetHeight 为内容高度
        waifu.style.right = "auto"; // 防止水平双锚拉伸:保证本帧起 offsetWidth 为内容宽度
        const touch = e.touches[0];
        const rect = waifu.getBoundingClientRect();
        const dx = touch.clientX - rect.left;
        const dy = touch.clientY - rect.top;
        const maxLeft = Math.max(0, window.innerWidth - waifu.offsetWidth);
        const maxTop = Math.max(0, window.innerHeight - waifu.offsetHeight);
        const onMove = (ev: TouchEvent) => {
          ev.preventDefault(); // 抑制页面滚动
          const t = ev.touches[0];
          waifu.style.left = `${Math.min(Math.max(t.clientX - dx, 0), maxLeft)}px`;
          waifu.style.top = `${Math.min(Math.max(t.clientY - dy, 0), maxTop)}px`;
        };
        const onEnd = () => {
          document.removeEventListener("touchmove", onMove);
          document.removeEventListener("touchend", onEnd);
          document.removeEventListener("touchcancel", onEnd);
          save(); // 触摸拖动的 mouseup 不可靠,结束时直接保存
        };
        document.addEventListener("touchmove", onMove, { passive: false });
        document.addEventListener("touchend", onEnd);
        document.addEventListener("touchcancel", onEnd);
      },
      { passive: true }
    );
  };

  // #waifu 由小部件异步创建:先查一次,未出现则用 MutationObserver 等待
  const applyIfReady = () => {
    const waifu = document.getElementById("waifu");
    if (!waifu) return false;
    restore(waifu);
    bindTouchDrag(waifu);
    return true;
  };

  if (!applyIfReady()) {
    const observer = new MutationObserver(() => {
      if (applyIfReady()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  document.addEventListener("mouseup", save);
}
