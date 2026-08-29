// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { readAccentColors } from "../accent-colors";

describe("readAccentColors", () => {
  it("returns fallback values when no CSS variables are defined", () => {
    const colors = readAccentColors();
    expect(colors.accent).toBe("#6366f1");
    expect(colors.violet).toBe("#8b5cf6");
    expect(colors.bg).toBe("#111827");
    expect(colors.fg).toBe("#f5f0eb");
  });

  it("reads accent colors from CSS variables", () => {
    const style = document.createElement("style");
    style.textContent = `
      :root {
        --color-accent: #111111;
        --color-accent-violet: #222222;
        --color-accent-pink: #333333;
        --color-accent-cyan: #444444;
        --color-accent-emerald: #555555;
        --color-accent-amber: #666666;
      }`;
    document.head.appendChild(style);
    const colors = readAccentColors();
    expect(colors.accent).toBe("#111111");
    expect(colors.amber).toBe("#666666");
  });

  it("reads surface colors from theme variables", () => {
    const style = document.createElement("style");
    style.textContent = `
      :root {
        --card-bg: #fbfaf8;
        --fg-color: #1c1917;
      }`;
    document.head.appendChild(style);
    const colors = readAccentColors();
    expect(colors.bg).toBe("#fbfaf8");
    expect(colors.fg).toBe("#1c1917");
  });
});
