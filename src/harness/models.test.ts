import { describe, it, expect } from "vitest";
import {
  MODELS,
  getModelConfig,
  OPENROUTER_ALLOWED_MODELS,
  assertOpenRouterModelAllowed,
} from "./models";

describe("model config", () => {
  it("defines the three v1 roster models on the right providers", () => {
    const byProvider = new Map(MODELS.map((m) => [m.provider, m]));
    expect(byProvider.has("groq")).toBe(true);
    expect(byProvider.has("google")).toBe(true);
    expect(byProvider.has("openrouter")).toBe(true);
    expect(MODELS).toHaveLength(3);
  });

  it("each model has a stable id, an env var, and a concrete slug", () => {
    for (const m of MODELS) {
      expect(m.id).toBeTruthy();
      expect(m.envVar).toMatch(/_API_KEY$/);
      expect(m.model).toBeTruthy();
      expect(m.label).toBeTruthy();
    }
    expect(new Set(MODELS.map((m) => m.id)).size).toBe(MODELS.length);
  });

  it("the OpenRouter model is restricted to the DeepSeek V4 Flash allowlist", () => {
    const or = MODELS.find((m) => m.provider === "openrouter")!;
    expect(OPENROUTER_ALLOWED_MODELS).toContain(or.model);
  });

  it("getModelConfig resolves a known id and throws on unknown", () => {
    expect(getModelConfig(MODELS[0].id).id).toBe(MODELS[0].id);
    expect(() => getModelConfig("gpt-4o")).toThrow();
  });
});

describe("assertOpenRouterModelAllowed (hard guardrail)", () => {
  it("permits the allowlisted model", () => {
    expect(() => assertOpenRouterModelAllowed(OPENROUTER_ALLOWED_MODELS[0])).not.toThrow();
  });

  it("blocks any expensive model routed through OpenRouter", () => {
    expect(() => assertOpenRouterModelAllowed("openai/gpt-4o")).toThrow(/openrouter/i);
    expect(() => assertOpenRouterModelAllowed("anthropic/claude-opus-4")).toThrow();
  });
});
