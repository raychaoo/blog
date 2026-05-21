"use client";

import dynamic from "next/dynamic";

const Giscus = dynamic(() => import("@/components/giscus"), {
  ssr: false,
  loading: () => (
    <div className="comment-section mt-12 pt-8 text-center text-muted-fg text-sm py-8">
      评论加载中...
    </div>
  ),
});

export default function DynamicGiscus() {
  return <Giscus />;
}
