import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";
import { getAllThoughts } from "@/lib/thoughts";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();
  const thoughts = getAllThoughts();

  return [
    {
      url: "https://your-domain.com",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://your-domain.com/posts",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: "https://your-domain.com/thoughts",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...posts.map((post) => ({
      url: `https://your-domain.com/posts/${post.slug}`,
      lastModified: new Date(post.frontmatter.date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...thoughts.map((thought) => ({
      url: `https://your-domain.com/thoughts/${thought.slug}`,
      lastModified: new Date(thought.frontmatter.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
