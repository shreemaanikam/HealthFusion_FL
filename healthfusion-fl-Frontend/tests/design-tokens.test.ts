import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { three3DTheme } from "@/lib/three/theme";

const css = readFileSync(path.resolve(__dirname, "../app/globals.css"), "utf8");

function token(name: string): string {
  const m = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m || !m[1]) throw new Error(`token --color-${name} not found in globals.css`);
  return m[1].toLowerCase();
}

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

// Every text/background pairing the UI actually uses for readable text.
const AA_PAIRS: [string, string][] = [
  ["ink", "paper"], ["ink", "surface"],
  ["slate", "paper"], ["slate", "surface"],
  ["mist", "paper"], ["mist", "surface"],
  ["teal", "paper"], ["teal", "surface"], ["teal", "teal-soft"],
  ["green", "green-soft"], ["green", "surface"],
  ["amber", "amber-soft"], ["amber", "surface"],
  ["red", "red-soft"], ["red", "surface"],
  ["surface", "navy"], ["surface", "teal"],
];

describe("WCAG AA text contrast (4.5:1)", () => {
  for (const [fg, bg] of AA_PAIRS) {
    it(`${fg} on ${bg}`, () => {
      expect(contrast(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5);
    });
  }
});

describe("3D theme stays in sync with the CSS tokens", () => {
  const camel = (s: string) => s.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
  for (const name of ["ink", "navy", "slate", "mist", "paper", "line", "surface", "teal", "green", "amber", "red"]) {
    it(name, () => {
      expect((three3DTheme as Record<string, string>)[camel(name)]?.toLowerCase()).toBe(token(name));
    });
  }
});
