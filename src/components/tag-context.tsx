"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface TagContextValue {
  activeTag: string | null;
  setActiveTag: (tag: string | null) => void;
}

const TagContext = createContext<TagContextValue | null>(null);

export function useTagContext() {
  const ctx = useContext(TagContext);
  if (!ctx) throw new Error("useTagContext must be used within TagProvider");
  return ctx;
}

export default function TagProvider({ children }: { children: React.ReactNode }) {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  return (
    <TagContext.Provider value={{ activeTag, setActiveTag }}>
      {children}
    </TagContext.Provider>
  );
}
