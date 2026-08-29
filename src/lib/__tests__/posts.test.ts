import { describe, it, expect } from "vitest";
import { estimateReadingTime, getAllPosts, findAdjacentPosts } from "../posts";
import type { PostMeta } from "../posts";

function makePost(slug: string, date: string): PostMeta {
  return {
    slug,
    frontmatter: {
      title: slug,
      date,
      description: "",
      tags: [],
    },
  };
}

describe("estimateReadingTime", () => {
  it("returns at least 1 minute for empty content", () => {
    expect(estimateReadingTime("")).toBe(1);
  });

  it("counts 350 CJK chars as 1 minute", () => {
    expect(estimateReadingTime("汉".repeat(350))).toBe(1);
  });

  it("counts 200 English words as 1 minute", () => {
    const en = Array.from({ length: 200 }, () => "word").join(" ");
    expect(estimateReadingTime(en)).toBe(1);
  });
});

describe("getAllPosts", () => {
  it("returns posts sorted newest first", () => {
    const posts = getAllPosts();
    const dates = posts.map((p) => new Date(p.frontmatter.date).getTime());
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
  });
});

describe("findAdjacentPosts", () => {
  // getAllPosts 按日期降序;输入保持同一约定:索引小者更新
  const posts = [
    makePost("c", "2026-08-01"),
    makePost("b", "2026-05-01"),
    makePost("a", "2026-01-01"),
  ];

  it("returns newer and older neighbors of a middle post", () => {
    expect(findAdjacentPosts(posts, "b")).toEqual({
      newer: posts[0],
      older: posts[2],
    });
  });

  it("returns null older for the oldest post", () => {
    expect(findAdjacentPosts(posts, "a")).toEqual({
      newer: posts[1],
      older: null,
    });
  });

  it("returns null newer for the newest post", () => {
    expect(findAdjacentPosts(posts, "c")).toEqual({
      newer: null,
      older: posts[1],
    });
  });

  it("returns both nulls for an unknown slug", () => {
    expect(findAdjacentPosts(posts, "missing")).toEqual({
      newer: null,
      older: null,
    });
  });

  it("handles a single-post list", () => {
    expect(findAdjacentPosts([posts[0]], "c")).toEqual({
      newer: null,
      older: null,
    });
  });
});
