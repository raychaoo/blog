import { getAllPosts, getAllTags } from "@/lib/posts";
import HomeClient from "@/components/home/home-client";

async function getGithubUser() {
  try {
    const res = await fetch("https://api.github.com/users/raychaoo");
    if (!res.ok) throw new Error("Failed to fetch");
    const data = await res.json();
    return {
      avatarUrl: data.avatar_url as string,
      name: (data.name as string) || (data.login as string),
      login: data.login as string,
    };
  } catch {
    return { avatarUrl: null, name: "raychaoo", login: "raychaoo" };
  }
}

export default async function HomePage() {
  const githubUser = await getGithubUser();
  return (
    <HomeClient
      githubAvatarUrl={githubUser.avatarUrl}
      githubName={githubUser.name}
      githubUsername={githubUser.login}
      postCount={getAllPosts().length}
      tagCount={getAllTags().length}
    />
  );
}
