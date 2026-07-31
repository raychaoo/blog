"use client";

import { useEffect, useState, useRef } from "react";
import { List, X } from "lucide-react";
import type { Heading } from "@/lib/posts";

interface TocProps {
  headings: Heading[];
}

export default function Toc({ headings }: TocProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-80px 0px -70% 0px" }
    );

    const elements: Element[] = [];
    for (const heading of headings) {
      const el = document.getElementById(heading.id);
      if (el) {
        observer.observe(el);
        elements.push(el);
      }
    }

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, [headings]);

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  if (headings.length === 0) return null;

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center cursor-pointer transition-transform active:scale-95"
        aria-label="打开目录"
        style={{ background: "var(--color-accent)", color: "var(--color-accent-foreground)", minWidth: 44, minHeight: 44 }}
      >
        <List size={20} />
      </button>

      {/* Desktop Sidebar */}
      <nav className="hidden lg:block" aria-label="文章目录">
        <h3 className="text-sm font-semibold mb-3 text-muted-fg uppercase tracking-wider">
          目录
        </h3>
        <ul className="space-y-0.5 text-sm">
          {headings.map((h) => (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                className={`toc-link flex items-center min-h-[36px] py-1 px-2 -mx-2 rounded-md ${
                  h.level === 3 ? "pl-6" : ""
                } ${
                  activeId === h.id
                    ? "active font-medium toc-active-bg"
                    : "text-muted-fg border-transparent hover:bg-[var(--muted-bg)]"
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollTo(h.id);
                }}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-black/40 animate-fade-in"
            onClick={() => setIsOpen(false)}
          />
          <div
            ref={drawerRef}
            className="relative ml-auto w-72 h-full bg-[var(--card-bg)] border-l border-[var(--card-border)] p-6 overflow-y-auto animate-slide-in-right"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-muted-fg uppercase tracking-wider">
                目录
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center text-muted-fg hover:text-fg transition-colors cursor-pointer"
                aria-label="关闭目录"
                style={{ width: 44, height: 44 }}
              >
                <X size={18} />
              </button>
            </div>
            <ul className="space-y-1 text-sm">
              {headings.map((h) => (
                <li key={h.id}>
                  <a
                    href={`#${h.id}`}
                    className={`flex items-center min-h-[40px] py-1.5 px-2 -mx-2 rounded-md ${
                      h.level === 3 ? "pl-6" : ""
                    } ${
                      activeId === h.id
                        ? "text-accent font-medium toc-active-bg"
                        : "text-muted-fg hover:bg-[var(--muted-bg)]"
                    } transition-colors`}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollTo(h.id);
                      setIsOpen(false);
                    }}
                  >
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
