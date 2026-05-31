"use client";

import { useState } from "react";

interface GithubContributionsProps {
  username: string;
}

export default function GithubContributions({ username }: GithubContributionsProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="text-center py-3 text-xs text-muted-fg">
        暂未加载到贡献数据
      </div>
    );
  }

  return (
    <div className="github-contributions mb-3">
      <img
        src={`https://ghchart.rshah.org/${username}`}
        alt={`${username} 的 GitHub 贡献图`}
        className="w-full h-auto"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
