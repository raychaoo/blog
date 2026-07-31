"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type ThemeName = "light" | "dark" | "sepia" | "ocean" | "lavender" | "midnight";

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  themes: { name: ThemeName; label: string; icon: string }[];
}

const THEMES: ThemeContextValue["themes"] = [
  { name: "light", label: "亮白", icon: "☀" },
  { name: "dark", label: "暗黑", icon: "☾" },
  { name: "sepia", label: "暖棕", icon: "♨" },
  { name: "ocean", label: "海洋", icon: "≈" },
  { name: "lavender", label: "薰衣草", icon: "⚘" },
  { name: "midnight", label: "子夜", icon: "★" },
];

const STORAGE_KEY = "blog-theme";

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useBlogTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useBlogTheme must be used within BlogThemeProvider");
  return ctx;
}

function getInitialTheme(): ThemeName {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(STORAGE_KEY) as ThemeName | null;
  if (stored && THEMES.some((t) => t.name === stored)) return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function BlogThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initial = getInitialTheme();
    setThemeState(initial);
    document.documentElement.setAttribute("data-theme", initial);
    setMounted(true);
  }, []);

  const setTheme = useCallback((t: ThemeName) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
    document.documentElement.setAttribute("data-theme", t);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}
