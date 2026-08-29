import { Rss } from "lucide-react";
import GithubMark from "./github-mark";

const GITHUB_URL = "https://github.com/raychaoo";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--card-border)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-fg">
        <span>© 2020–{new Date().getFullYear()} VibeCoding Blog</span>
        <div className="flex items-center gap-4">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-fg"
          >
            <GithubMark size={14} />
            GitHub
          </a>
          <a href="/rss.xml" className="inline-flex items-center gap-1.5 transition-colors hover:text-fg">
            <Rss size={14} />
            RSS
          </a>
        </div>
      </div>
    </footer>
  );
}
