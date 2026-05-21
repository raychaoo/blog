"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { Search, ArrowRight, FileText, Hash, Calendar } from "lucide-react";

interface SearchDoc {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  date: string;
}

export default function SearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchDoc[]>([]);
  const [fuse, setFuse] = useState<Fuse<SearchDoc> | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Load search index
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/search");
        const data: SearchDoc[] = await res.json();
        setFuse(
          new Fuse(data, {
            keys: [
              { name: "title", weight: 2 },
              { name: "tags", weight: 1.5 },
              { name: "description", weight: 1 },
            ],
            threshold: 0.35,
            includeScore: true,
          })
        );
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Keyboard shortcut: ⌘K / Ctrl+K
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Focus input and reset on open
  useEffect(() => {
    if (open) {
      setActiveIndex(-1);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll<HTMLElement>("[data-index]");
    items[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const handleSearch = useCallback(
    (val: string) => {
      setQuery(val);
      setActiveIndex(-1);
      if (!fuse || !val.trim()) {
        setResults([]);
        return;
      }
      setResults(fuse.search(val).map((r) => r.item).slice(0, 10));
    },
    [fuse]
  );

  const goTo = useCallback(
    (slug: string) => {
      setOpen(false);
      setQuery("");
      setResults([]);
      router.push(`/posts/${slug}`);
    },
    [router]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i < results.length - 1 ? i + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i > 0 ? i - 1 : results.length - 1));
      } else if (e.key === "Enter" && activeIndex >= 0 && results[activeIndex]) {
        e.preventDefault();
        goTo(results[activeIndex].slug);
      }
    },
    [results, activeIndex, goTo]
  );

  // Highlight matching text
  function highlight(text: string, q: string) {
    if (!q.trim()) return text;
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escaped})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === q.toLowerCase() ? (
        <mark key={i} className="bg-[var(--color-accent)]/20 text-fg rounded-sm px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  }

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="flex touch-target items-center gap-1.5 sm:gap-2 text-xs text-muted-fg hover:text-fg transition-colors cursor-pointer px-1.5"
        aria-label="搜索 (⌘K)"
      >
        <Search size={15} />
        <span className="hidden sm:inline">搜索</span>
        <kbd className="hidden sm:inline-flex text-[10px] px-1 py-0.5 rounded border border-[var(--card-border)] text-muted-fg leading-none">
          ⌘K
        </kbd>
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setOpen(false)}
          />

          {/* Dialog */}
          <div className="flex items-start justify-center pt-[12vh] sm:pt-[18vh] pointer-events-none">
            <div
              className="w-full max-w-xl mx-3 sm:mx-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl shadow-2xl overflow-hidden animate-fade-up pointer-events-auto"
              style={{ animationDelay: "0ms" }}
            >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 h-13 border-b border-[var(--card-border)]">
              <Search size={17} className="text-muted-fg shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="搜索文章..."
                autoComplete="off"
                spellCheck={false}
                className="flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-muted-fg/60"
              />
              {query && (
                <button
                  onClick={() => handleSearch("")}
                  className="text-muted-fg hover:text-fg transition-colors cursor-pointer p-1"
                  aria-label="清除"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
              <kbd className="hidden sm:inline-flex text-[10px] px-1.5 py-0.5 rounded border border-[var(--card-border)] text-muted-fg shrink-0 leading-none">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[350px] overflow-y-auto overscroll-contain">
              {/* Loading */}
              {loading && (
                <div className="py-10 text-center">
                  <div className="w-5 h-5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              )}

              {/* Initial state */}
              {!loading && !query && (
                <div className="py-10 text-center text-xs text-muted-fg">
                  <Search size={24} className="mx-auto mb-3 opacity-30" />
                  输入关键词搜索文章
                </div>
              )}

              {/* No results */}
              {!loading && query && results.length === 0 && (
                <div className="py-10 text-center text-xs text-muted-fg">
                  <FileText size={24} className="mx-auto mb-3 opacity-30" />
                  没有找到匹配 "{query}" 的文章
                </div>
              )}

              {/* Results list */}
              {results.length > 0 && (
                <>
                  <div className="px-4 py-2 text-[11px] text-muted-fg/60 font-medium uppercase tracking-wider">
                    共 {results.length} 条结果
                  </div>
                  {results.map((doc, i) => (
                    <button
                      key={doc.slug}
                      data-index={i}
                      onClick={() => goTo(doc.slug)}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={`w-full text-left px-4 py-3 transition-colors border-b border-[var(--card-border)] last:border-0 cursor-pointer ${
                        i === activeIndex
                          ? "bg-[var(--color-accent)]/8"
                          : "hover:bg-[var(--muted-bg)]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <FileText
                          size={15}
                          className={`mt-0.5 shrink-0 ${
                            i === activeIndex
                              ? "text-[var(--color-accent)]"
                              : "text-muted-fg"
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-fg">
                            {highlight(doc.title, query)}
                          </div>
                          {doc.description && (
                            <div className="text-xs text-muted-fg mt-0.5 line-clamp-1 leading-relaxed">
                              {highlight(doc.description, query)}
                            </div>
                          )}
                          <div className="flex items-center gap-2.5 mt-1.5">
                            {doc.date && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-muted-fg/60">
                                <Calendar size={10} />
                                {new Date(doc.date).toLocaleDateString("zh-CN", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            )}
                            {doc.tags && doc.tags.length > 0 && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-muted-fg/60">
                                <Hash size={10} />
                                {doc.tags.slice(0, 2).join(", ")}
                              </span>
                            )}
                          </div>
                        </div>
                        <ArrowRight
                          size={14}
                          className={`shrink-0 mt-1 transition-opacity ${
                            i === activeIndex
                              ? "text-[var(--color-accent)] opacity-100"
                              : "text-muted-fg opacity-40"
                          }`}
                        />
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>

            {/* Footer hint */}
            <div className="hidden sm:flex items-center gap-4 px-4 py-2 border-t border-[var(--card-border)] bg-[var(--muted-bg)]/30">
              <span className="flex items-center gap-1 text-[10px] text-muted-fg/50">
                <kbd className="px-1 py-0.5 rounded border border-[var(--card-border)] text-[9px] leading-none">↑</kbd>
                <kbd className="px-1 py-0.5 rounded border border-[var(--card-border)] text-[9px] leading-none">↓</kbd>
                导航
              </span>
              <span className="flex items-center gap-1 text-[10px] text-muted-fg/50">
                <kbd className="px-1.5 py-0.5 rounded border border-[var(--card-border)] text-[9px] leading-none">⏎</kbd>
                打开
              </span>
              <span className="flex items-center gap-1 text-[10px] text-muted-fg/50">
                <kbd className="px-1.5 py-0.5 rounded border border-[var(--card-border)] text-[9px] leading-none">ESC</kbd>
                关闭
              </span>
            </div>
          </div>
          </div>
        </div>
      )}
    </>
  );
}
