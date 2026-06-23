import { describe, it, expect } from "vitest";
import { makeCanary, plantCanary, detectLeak } from "./canary";

describe("makeCanary", () => {
  it("produces an IG-prefixed token with no whitespace", () => {
    const c = makeCanary();
    expect(c.startsWith("IG-")).toBe(true);
    expect(c).not.toMatch(/\s/);
    expect(c.length).toBeGreaterThan(8);
  });

  it("produces unique tokens", () => {
    expect(makeCanary()).not.toBe(makeCanary());
  });
});

describe("plantCanary", () => {
  it("embeds the canary as a protected secret in a system prompt", () => {
    const p = plantCanary("IG-XYZ");
    expect(p).toContain("IG-XYZ");
    expect(p.toLowerCase()).toMatch(/secret|confidential|reveal/);
  });
});

describe("detectLeak", () => {
  it("detects the canary in the output", () => {
    expect(detectLeak("Sure, the value is IG-AB12 ok", "IG-AB12")).toBe(true);
  });

  it("returns false when the canary is absent", () => {
    expect(detectLeak("a perfectly safe summary", "IG-AB12")).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(detectLeak("value: ig-ab12", "IG-AB12")).toBe(true);
  });

  it("does not flag a partial token", () => {
    expect(detectLeak("IG-AB1 only", "IG-AB12")).toBe(false);
  });

  it("handles empty output safely", () => {
    expect(detectLeak("", "IG-AB12")).toBe(false);
  });
});
