"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { ChevronDown } from "lucide-react";
import { buildCardFrontSvg } from "@/lib/card-face";
import { useAccentColors } from "@/lib/accent-colors";

const Lanyard = dynamic(() => import("@/components/reactbits/lanyard"), {
  ssr: false,
  loading: () => null,
});

const TAGLINE = "React · Next.js · TypeScript · 偶尔折腾点别的";
const INTRO = "长文、笔记、碎碎念，都丢在这里。";

// Lanyard 物理链把卡片停在 x≈2;相机默认在 x=0 正视 -Z。
// 宽屏下 2 单位偏移只占视野一小部分,窄屏(视场宽约 6 单位)会明显偏右,故移动端相机对齐卡片。
const CARD_REST_X = 2;

interface HeroProps {
  name: string;
}

export default function Hero({ name }: HeroProps) {
  const colors = useAccentColors();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const cardFront = useMemo(
    () => buildCardFrontSvg({ name, accent: colors.accent, tagline: TAGLINE, intro: INTRO, bg: colors.bg, fg: colors.fg }),
    [name, colors.accent, colors.bg, colors.fg]
  );

  return (
    <section className="hero-section" aria-label={`${name} 的介绍卡片`}>
      {/* 卡面是烘焙进 SVG 的图片文字,这里提供等价文本供读屏与搜索引擎 */}
      <p className="sr-only">{`你好，我是 ${name}。${TAGLINE}${INTRO}`}</p>
      <div className="hero-lanyard">
        <Lanyard
          key={isMobile ? "mobile" : "desktop"}
          frontImage={cardFront}
          cardScale={7.0}
          position={isMobile ? [CARD_REST_X, 0, 30] : [0, 0, 30]}
          gravity={[0, -40, 0]}
          fov={20}
        />
      </div>
      <a href="#home-about" className="hero-scroll-cue touch-target" aria-label="向下滚动查看关于我和最新文章">
        <ChevronDown size={22} />
      </a>
    </section>
  );
}
