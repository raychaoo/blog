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
  { label: "碎碎念", href: "/thoughts" },
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

  return (
    <header className="site-header sticky top-0 z-30 backdrop-blur-sm">
      {/*
        Mobile (<640px): two rows — logo + controls on the first row, the
        nav centered on its own second row. On a single row the 3 nav items
        + logo + search + theme don't fit 375px/320px viewports and flex
        crushes every item down to one Chinese character per line.
      */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2 sm:py-0 sm:h-14 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
        <Link href="/" className="font-heading font-semibold text-lg tracking-tight shrink-0">
          VibeCoding
        </Link>
        <div className="order-last w-full flex justify-center sm:order-none sm:w-auto">
          <GooeyNav
            items={NAV_ITEMS}
            activeIndex={getActiveIndex(pathname)}
            colors={[colors.accent, colors.violet, colors.pink, colors.cyan]}
          />
        </div>
        {/*
          Controls come after the nav in the DOM so that on desktop
          (justify-between) they sit at the far right, with the nav centered
          between them and the logo. On mobile the nav wrapper is order-last
          + full-width, so controls share row 1 with the logo.
        */}
        <div className="flex items-center gap-2 sm:gap-4">
          <SearchModal />
          <ThemePicker />
        </div>
      </div>
    </header>
  );
}
