import Link from "next/link";
import ThemePicker from "./theme-picker";
import SearchModal from "./search";

export default function Header() {
  return (
    <header className="site-header sticky top-0 z-30 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="font-heading font-semibold text-lg tracking-tight">
          VibeCoding Blog
        </Link>
        <div className="flex items-center gap-3">
          <nav className="flex items-center gap-3 text-sm text-muted-fg">
            <Link href="/" className="hover:text-fg transition-colors">
              首页
            </Link>
          </nav>
          <SearchModal />
          <ThemePicker />
        </div>
      </div>
    </header>
  );
}
