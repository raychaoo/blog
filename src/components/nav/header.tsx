"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import GooeyNav from "@/components/reactbits/gooey-nav";
import ThemePicker from "@/components/theme/theme-picker";
import SearchModal from "@/components/search/search";
import { useAccentColors } from "@/lib/accent-colors";

const NAV_ITEMS = [
  { label: "首页", href: "/" },
  { label: "文章", href: "/posts" },
  { label: "碎碎念念", href: "/thoughts" },
];

function getActiveIndex(pathname: string): number {
  if (pathname === "/") return 0;
  if (pathname.startsWith("/posts")) return 1;
  if (pathname.startsWith("/thoughts")) return 2;
  return 0;
}

export default function Header() {
  const pathname = usePathname();
  const colors = useAccentColors();
  const showSearch = pathname.startsWith("/posts") || pathname.startsWith("/thoughts");

  return (
    <header className="site-header sticky top-0 z-30 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="font-heading font-semibold text-lg tracking-tight shrink-0">
          VibeCoding
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <GooeyNav
            items={NAV_ITEMS}
            activeIndex={getActiveIndex(pathname)}
            colors={[colors.accent, colors.violet, colors.pink, colors.cyan]}
          />
          {showSearch && <SearchModal />}
          <ThemePicker />
        </div>
      </div>
    </header>
  );
}
