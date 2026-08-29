import { useContext, useMemo } from "react";
import { ThemeContext } from "@/components/theme/theme-provider";

export interface AccentColors {
  accent: string;
  violet: string;
  pink: string;
  cyan: string;
  emerald: string;
  amber: string;
  /** 主题卡面底色(--card-bg),供 3D 卡面等烘焙场景随主题变化 */
  bg: string;
  /** 主题前景色(--fg-color) */
  fg: string;
}

const FALLBACKS: AccentColors = {
  accent: "#6366f1",
  violet: "#8b5cf6",
  pink: "#ec4899",
  cyan: "#06b6d4",
  emerald: "#10b981",
  amber: "#f59e0b",
  bg: "#111827",
  fg: "#f5f0eb",
};

const VAR_NAMES: (keyof AccentColors)[] = [
  "accent",
  "violet",
  "pink",
  "cyan",
  "emerald",
  "amber",
];

export function readAccentColors(): AccentColors {
  if (typeof window === "undefined") return FALLBACKS;
  const cs = getComputedStyle(document.documentElement);
  const result = { ...FALLBACKS };
  for (const key of VAR_NAMES) {
    const value = cs.getPropertyValue(`--color-accent-${key}`).trim();
    if (value) result[key] = value;
  }
  const accent = cs.getPropertyValue("--color-accent").trim();
  if (accent) result.accent = accent;
  const bg = cs.getPropertyValue("--card-bg").trim();
  if (bg) result.bg = bg;
  const fg = cs.getPropertyValue("--fg-color").trim();
  if (fg) result.fg = fg;
  return result;
}

export function useAccentColors(): AccentColors {
  const theme = useContext(ThemeContext)?.theme;
  return useMemo(() => readAccentColors(), [theme]);
}
