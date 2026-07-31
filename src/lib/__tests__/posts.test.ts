import { describe, it, expect } from "vitest";
import { estimateReadingTime, getAllPosts } from "../posts";

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
