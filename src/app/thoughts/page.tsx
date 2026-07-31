import type { Metadata } from "next";
import { getAllThoughts, extractPreview } from "@/lib/thoughts";
import ThoughtsClient from "@/components/thoughts/thoughts-client";
import type { ThoughtMeta } from "@/lib/thoughts";

export const metadata: Metadata = {
  title: "碎碎念念",
  description: "碎片化的想法与日常记录",
};

// Attach a server-side computed preview so the client avoids importing the
// Node-only (fs/path) `@/lib/thoughts` module into its browser bundle.
interface ThoughtView extends ThoughtMeta {
  preview: string;
}

export default function ThoughtsPage() {
  const thoughts: ThoughtView[] = getAllThoughts().map((t) => ({
    slug: t.slug,
    frontmatter: t.frontmatter,
    preview: extractPreview(t.content, 3),
  }));
  return <ThoughtsClient thoughts={thoughts} />;
}
