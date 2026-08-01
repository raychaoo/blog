"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { buildCardFrontSvg } from "@/lib/card-face";
import { useAccentColors } from "@/lib/accent-colors";

const Lanyard = dynamic(() => import("@/components/reactbits/lanyard"), {
  ssr: false,
  loading: () => null,
});

const TAGLINE = "全栈开发者 · 热爱 React 与 TypeScript · 记录技术学习与思考";
const INTRO = "记录前端工程化、React 生态与开发效率的实践，有长文，也有碎碎念念。";

interface HeroProps {
  name: string;
}

export default function Hero({ name }: HeroProps) {
  const colors = useAccentColors();
  const cardFront = useMemo(
    () => buildCardFrontSvg({ name, accent: colors.accent, tagline: TAGLINE, intro: INTRO }),
    [name, colors.accent]
  );

  return (
    <section className="hero-section">
      <div className="hero-lanyard">
        <Lanyard frontImage={cardFront} cardScale={3.8} position={[0, 0, 30]} gravity={[0, -40, 0]} fov={20} />
      </div>
    </section>
  );
}
