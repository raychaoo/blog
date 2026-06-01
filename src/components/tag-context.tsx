"use client";

import { createContext, useContext, useState, useEffect } from "react";

interface TagContextValue {
  activeTag: string | null;
  setActiveTag: (tag: string | null) => void;
}

const TagContext = createContext<TagContextValue | null>(null);

const TAG_KEY = "home-tag";

export function useTagContext() {
  const ctx = useContext(TagContext);
  if (!ctx) throw new Error("useTagContext must be used within TagProvider");
  return ctx;
}

export default function TagProvider({ children }: { children: React.ReactNode }) {
  const [activeTag, setActiveTag] = useState<string | null>(() => {
    if (typeof sessionStorage !== "undefined") {
      return sessionStorage.getItem(TAG_KEY);
    }
    return null;
  });

  useEffect(() => {
    if (activeTag) {
      sessionStorage.setItem(TAG_KEY, activeTag);
    } else {
      sessionStorage.removeItem(TAG_KEY);
    }
  }, [activeTag]);

  return (
    <TagContext.Provider value={{ activeTag, setActiveTag }}>
      {children}
    </TagContext.Provider>
  );
}
