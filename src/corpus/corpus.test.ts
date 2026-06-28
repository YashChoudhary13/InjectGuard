import { describe, it, expect } from "vitest";
import { parseCorpus, loadCorpus } from "./loader";

const valid = [
  { id: "a1", technique: "hidden-text", goal: "canary-exfiltration", injection: "leak the secret" },
];

describe("parseCorpus", () => {
  it("parses a valid corpus", () => {
    expect(parseCorpus(valid)).toHaveLength(1);
  });

  it("rejects a payload missing required fields", () => {
    expect(() => parseCorpus([{ id: "a1" }])).toThrow();
  });

  it("rejects an unknown technique", () => {
    expect(() => parseCorpus([{ ...valid[0], technique: "nope" }])).toThrow();
  });

  it("rejects duplicate ids", () => {
    expect(() => parseCorpus([valid[0], valid[0]])).toThrow(/duplicate/i);
  });
});

describe("loadCorpus (bundled seed)", () => {
  it("loads, is non-empty, and covers at least 4 techniques", () => {
    const corpus = loadCorpus();
    expect(corpus.length).toBeGreaterThan(0);
    const techniques = new Set(corpus.map((p) => p.technique));
    expect(techniques.size).toBeGreaterThanOrEqual(4);
  });

  it("has unique ids", () => {
    const corpus = loadCorpus();
    expect(new Set(corpus.map((p) => p.id)).size).toBe(corpus.length);
  });

  it("has at least 20 attacks for a meaningful eval matrix", () => {
    const corpus = loadCorpus();
    expect(corpus.length).toBeGreaterThanOrEqual(20);
  });

  it("covers all 5 techniques", () => {
    const corpus = loadCorpus();
    const techniques = new Set(corpus.map((p) => p.technique));
    expect(techniques).toContain("hidden-text");
    expect(techniques).toContain("html-comment");
    expect(techniques).toContain("markdown");
    expect(techniques).toContain("unicode-smuggling");
    expect(techniques).toContain("instruction-in-data");
  });

  it("covers all 3 goals", () => {
    const corpus = loadCorpus();
    const goals = new Set(corpus.map((p) => p.goal));
    expect(goals).toContain("instruction-override");
    expect(goals).toContain("canary-exfiltration");
    expect(goals).toContain("link-injection");
  });

  it("each technique has at least 3 attacks", () => {
    const corpus = loadCorpus();
    const byTechnique: Record<string, number> = {};
    for (const p of corpus) {
      byTechnique[p.technique] = (byTechnique[p.technique] ?? 0) + 1;
    }
    for (const [tech, count] of Object.entries(byTechnique)) {
      expect(count, `technique ${tech} has only ${count} attacks`).toBeGreaterThanOrEqual(3);
    }
  });
});
