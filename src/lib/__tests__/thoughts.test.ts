import { describe, it, expect } from "vitest";
import { extractPreview, getAllThoughts } from "../thoughts";

describe("extractPreview", () => {
  it("strips markdown syntax and joins the first lines", () => {
    const md = "# 标题\n第一行 **加粗** 内容\n第二行 `代码`\n第三行";
    expect(extractPreview(md, 2)).toBe("第一行 加粗 内容 第二行 代码");
  });

  it("keeps only the alt text of images and the text of links", () => {
    const md = "看图 ![账单截图](/thoughts/x/before.png) 与 [往期文章](/thoughts/first-murmur) 的对比";
    expect(extractPreview(md, 1)).toBe("看图 账单截图 与 往期文章 的对比");
  });

  it("truncates long previews with an ellipsis", () => {
    const long = "字".repeat(200);
    const preview = extractPreview(long, 3);
    expect(preview.length).toBeLessThanOrEqual(121);
    expect(preview.endsWith("…")).toBe(true);
  });
});

describe("getAllThoughts", () => {
  it("reads local thought files sorted newest first", () => {
    const thoughts = getAllThoughts();
    const dates = thoughts.map((t) => new Date(t.frontmatter.date).getTime());
    expect(dates).toEqual([...dates].sort((a, b) => b - a));
  });
});
