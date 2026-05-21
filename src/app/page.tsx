import { getAllPosts, getAllTags } from '@/lib/posts';
import HomeClient from '@/components/home-client';

export default async function HomePage() {
  const allPosts = getAllPosts();
  const tags = getAllTags();

  const startYear = '2020';

  return (
    <HomeClient
      tags={tags}
      posts={allPosts}
      allPostsCount={allPosts.length}
      startYear={startYear}
    />
  );
}
