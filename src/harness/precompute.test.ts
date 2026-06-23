import { describe, it, expect } from "vitest";
import { precompute } from "./precompute";
import { inProcessEvaluate } from "./promptfooRunner";
import { simulateVictim, simulateJudge } from "./simulate";
import { loadCorpus } from "../corpus/loader";
import { MODELS } from "./models";

describe("precompute (dry run with simulated adapters)", () => {
  const corpus = loadCorpus();

  it("produces a complete ResultsFile across all models with the defense pipeline applied", async () => {
    const results = await precompute({
      models: MODELS,
      corpus,
      cleanPage: "A short guide to brewing pour-over coffee.",
      victimFor: (modelId) => simulateVictim(modelId, "IG-DRY"),
      judgeLlm: simulateJudge,
      canary: "IG-DRY",
      mode: "synthetic",
      judgeModel: "synthetic",
      generatedAt: "2026-06-23T00:00:00.000Z",
      evaluate: inProcessEvaluate,
    });

    expect(results.mode).toBe("synthetic");
    expect(results.attackCount).toBe(corpus.length);
    expect(results.models).toHaveLength(MODELS.length);
    expect(results.runs).toHaveLength(MODELS.length * corpus.length * 2);

    for (const m of results.models) {
      // defense never makes a model worse
      expect(m.delta).toBeGreaterThanOrEqual(0);
      // in the simulation the defense blocks every attack
      expect(m.successRateOn).toBe(0);
      // rates are valid probabilities
      expect(m.successRateOff).toBeGreaterThanOrEqual(0);
      expect(m.successRateOff).toBeLessThanOrEqual(1);
      expect(m.byTechnique.length).toBeGreaterThan(0);
    }
  });

  it("at least one model is measurably hijacked with the defense OFF (data isn't degenerate)", async () => {
    const results = await precompute({
      models: MODELS,
      corpus,
      cleanPage: "A short guide to repotting houseplants.",
      victimFor: (modelId) => simulateVictim(modelId, "IG-DRY"),
      judgeLlm: simulateJudge,
      canary: "IG-DRY",
      mode: "synthetic",
      judgeModel: "synthetic",
      generatedAt: "2026-06-23T00:00:00.000Z",
      evaluate: inProcessEvaluate,
    });
    expect(results.models.some((m) => m.successRateOff > 0)).toBe(true);
  });
});
