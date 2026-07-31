import type { Metadata } from "next";
import { getAllPosts } from "@/lib/posts";
import PostsClient from "@/components/posts/posts-client";

export const metadata: Metadata = {
  title: "文章",
  description: "全部技术文章列表",
};

export default function PostsPage() {
  const posts = getAllPosts();
  return <PostsClient posts={posts} />;
}
