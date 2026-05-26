import { getAllPosts, getAllTags } from '@/lib/posts';
import HomeClient from '@/components/home-client';

async function getGithubUser() {
  try {
    const res = await fetch('https://api.github.com/users/raychaoo');
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    return {
      avatarUrl: data.avatar_url as string,
      name: (data.name as string) || (data.login as string),
    };
  } catch {
    return { avatarUrl: null, name: 'raychaoo' };
  }
}

export default async function HomePage() {
  const allPosts = getAllPosts();
  const tags = getAllTags();
  const githubUser = await getGithubUser();

  const startYear = '2020';

  return (
    <HomeClient
      tags={tags}
      posts={allPosts}
      allPostsCount={allPosts.length}
      startYear={startYear}
      githubAvatarUrl={githubUser.avatarUrl}
      githubName={githubUser.name}
    />
  );
}
