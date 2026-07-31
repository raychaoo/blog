"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import SplitText from "@/components/reactbits/split-text";
import TextType from "@/components/reactbits/text-type";
import Shuffle from "@/components/reactbits/shuffle";
import { useAccentColors } from "@/lib/accent-colors";

const Lanyard = dynamic(() => import("@/components/reactbits/lanyard"), {
  ssr: false,
  loading: () => null,
});

function buildCardFrontSvg(name: string, tagline: string, accent: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300" viewBox="0 0 480 300">` +
    `<rect width="480" height="300" rx="24" fill="#111827" opacity="0.92"/>` +
    `<rect x="14" y="14" width="452" height="272" rx="18" fill="none" stroke="${accent}" stroke-width="2" opacity="0.6"/>` +
    `<text x="240" y="140" text-anchor="middle" font-family="sans-serif" font-size="44" font-weight="700" fill="#ffffff">${name}</text>` +
    `<text x="240" y="188" text-anchor="middle" font-family="sans-serif" font-size="22" fill="#cbd5e1">${tagline}</text>` +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

interface HeroProps {
  name: string;
}

export default function Hero({ name }: HeroProps) {
  const colors = useAccentColors();
  const cardFront = useMemo(
    () => buildCardFrontSvg(name, "全栈开发者 · React / Next.js / TypeScript", colors.accent),
    [name, colors.accent]
  );

  return (
    <section className="hero-section">
      <div className="hero-copy">
        <Shuffle
          text="VibeCoding · Blog"
          className="inline-block text-xs uppercase tracking-[0.25em] text-muted-fg mb-3"
        />

        <h1 className="hero-title">
          <SplitText
            text={`你好，我是 ${name}`}
            className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight"
            delay={0.15}
            from={{ opacity: 0, y: 24 }}
            to={{ opacity: 1, y: 0 }}
          />
        </h1>

        <p className="hero-tagline">
          <TextType
            text={["全栈开发者", "热爱 React 与 TypeScript", "记录技术学习与思考"]}
            as="span"
            textColors={["var(--color-accent)"]}
            className="text-lg sm:text-xl text-muted-fg"
          />
        </p>

        <p className="hero-intro text-sm sm:text-base text-muted-fg max-w-xl">
          记录技术学习与开发实践，涵盖前端工程化、React 生态、开发效率等话题。这里有长文、有碎碎念念，也有我自己。
        </p>

        <div className="hero-actions flex flex-wrap gap-3">
          <Link href="/posts" className="btn-press btn-primary">
            浏览文章
          </Link>
          <Link href="/thoughts" className="btn-press btn-secondary">
            碎碎念念
          </Link>
        </div>
      </div>

      <div className="hero-lanyard" aria-hidden>
        <Lanyard frontImage={cardFront} position={[0, 0, 30]} gravity={[0, -40, 0]} fov={20} />
      </div>
    </section>
  );
}
