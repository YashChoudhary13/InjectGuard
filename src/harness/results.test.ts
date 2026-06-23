import { describe, it, expect } from "vitest";
import { aggregate } from "./results";
import { getModelConfig } from "./models";
import type { HarnessRun } from "./promptfooRunner";

function run(over: Partial<HarnessRun>): HarnessRun {
  return {
    modelId: "groq-llama",
    id: "a",
    technique: "hidden-text",
    goal: "instruction-override",
    defense: false,
    hijacked: false,
    method: "llm",
    reason: "",
    response: "",
    canary: "IG-X",
    ...over,
  };
}

const runs: HarnessRun[] = [
  // hidden-text: blocked by defense (off hijacked, on safe)
  run({ id: "h1", technique: "hidden-text", defense: false, hijacked: true }),
  run({ id: "h1", technique: "hidden-text", defense: true, hijacked: false }),
  // markdown: defense did NOT help here (off hijacked, on still hijacked)
  run({ id: "m1", technique: "markdown", defense: false, hijacked: true }),
  run({ id: "m1", technique: "markdown", defense: true, hijacked: true }),
];

describe("aggregate", () => {
  const out = aggregate(runs, [getModelConfig("groq-llama")], {
    mode: "synthetic",
    judgeModel: "gemini-flash",
    generatedAt: "2026-06-23T00:00:00.000Z",
  });

  it("writes metadata and provenance", () => {
    expect(out.schemaVersion).toBe(1);
    expect(out.mode).toBe("synthetic");
    expect(out.judgeModel).toBe("gemini-flash");
    expect(out.generatedAt).toBe("2026-06-23T00:00:00.000Z");
    expect(out.attackCount).toBe(2);
  });

  it("computes per-model off/on success rates and the defense delta", () => {
    expect(out.models).toHaveLength(1);
    const m = out.models[0];
    expect(m.id).toBe("groq-llama");
    expect(m.label).toBe("Llama 3.3 70B (Groq)");
    expect(m.attacks).toBe(2);
    expect(m.successRateOff).toBe(1); // 2/2 hijacked off
    expect(m.successRateOn).toBe(0.5); // 1/2 hijacked on
    expect(m.delta).toBe(0.5); // off - on improvement
  });

  it("breaks results down per technique", () => {
    const m = out.models[0];
    const byTech = new Map(m.byTechnique.map((t) => [t.technique, t]));
    expect(byTech.get("hidden-text")).toMatchObject({ successRateOff: 1, successRateOn: 0, delta: 1 });
    expect(byTech.get("markdown")).toMatchObject({ successRateOff: 1, successRateOn: 1, delta: 0 });
  });

  it("emits a compact runs array for the ticker", () => {
    expect(out.runs).toHaveLength(4);
    expect(out.runs[0]).toMatchObject({ modelId: "groq-llama", attackId: "h1", technique: "hidden-text" });
    expect(out.runs[0]).not.toHaveProperty("response"); // response text excluded
  });
});
