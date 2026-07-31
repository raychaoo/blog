"use client";

import { useState, useContext } from "react";
import { ThemeContext } from "./theme-provider";
import { Palette } from "lucide-react";

export default function ThemePicker() {
  const ctx = useContext(ThemeContext);
  const [open, setOpen] = useState(false);

  if (!ctx) return null;

  const { theme, setTheme, themes } = ctx;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-md hover:bg-surface-muted transition-colors cursor-pointer touch-target"
        aria-label="切换主题"
      >
        <Palette size={16} className="text-muted-fg" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-2xl p-2 pt-3 min-w-[180px]"
          onMouseLeave={() => setOpen(false)}
        >
          {themes.map((t) => (
            <button
              key={t.name}
              onClick={() => {
                setTheme(t.name);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
                theme === t.name
                  ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium"
                  : "text-fg hover:bg-[var(--muted-bg)]"
              }`}
            >
              <span className="text-base leading-none w-5 text-center">{t.icon}</span>
              <span>{t.label}</span>
              {theme === t.name && (
                <span className="ml-auto text-xs opacity-60">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
