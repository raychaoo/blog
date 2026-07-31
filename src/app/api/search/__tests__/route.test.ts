import { describe, it, expect } from "vitest";
import { GET } from "../route";

describe("GET /api/search", () => {
  it("returns posts and thoughts index arrays", async () => {
    const res = await GET();
    const data = await res.json();
    expect(Array.isArray(data.posts)).toBe(true);
    expect(Array.isArray(data.thoughts)).toBe(true);
  });

  it("includes existing posts", async () => {
    const res = await GET();
    const data = await res.json();
    expect(data.posts.length).toBeGreaterThan(0);
    expect(data.posts[0]).toHaveProperty("slug");
    expect(data.posts[0]).toHaveProperty("title");
  });
});
