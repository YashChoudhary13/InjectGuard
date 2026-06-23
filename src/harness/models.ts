/**
 * Model roster + cost guardrails. Single source of truth mapping a logical model
 * id → concrete provider/slug/key (see docs/MODELS.md). Edit slugs HERE when
 * confirming them at wire-time; nothing else hardcodes a provider model string.
 *
 * Hard rule: OpenRouter is restricted to DeepSeek V4 Flash ONLY. Never route an
 * expensive model through it. The allowlist below enforces that in code.
 */

export type Provider = "groq" | "google" | "openrouter";

export interface ModelConfig {
  /** Stable id used in results.json + the UI. */
  id: string;
  /** Human label for the leaderboard. */
  label: string;
  provider: Provider;
  /** Concrete provider model slug (confirm at wire-time). */
  model: string;
  /** Env var holding the API key. */
  envVar: string;
}

/** The ONLY models permitted through OpenRouter. */
export const OPENROUTER_ALLOWED_MODELS = ["deepseek/deepseek-v4-flash"] as const;

/** Throws unless `model` is an allowlisted OpenRouter model. */
export function assertOpenRouterModelAllowed(model: string): void {
  if (!(OPENROUTER_ALLOWED_MODELS as readonly string[]).includes(model)) {
    throw new Error(
      `OpenRouter is restricted to ${OPENROUTER_ALLOWED_MODELS.join(", ")} — refusing "${model}".`,
    );
  }
}

export const MODELS: ModelConfig[] = [
  {
    id: "groq-llama",
    label: "Llama 3.3 70B (Groq)",
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    envVar: "GROQ_API_KEY",
  },
  {
    id: "gemini-flash",
    label: "Gemini 2.0 Flash (Google)",
    provider: "google",
    model: "gemini-2.0-flash",
    envVar: "GOOGLE_API_KEY",
  },
  {
    id: "deepseek-v4-flash",
    label: "DeepSeek V4 Flash (OpenRouter)",
    provider: "openrouter",
    model: OPENROUTER_ALLOWED_MODELS[0],
    envVar: "OPENROUTER_API_KEY",
  },
];

/** Resolve a model config by id; throws on unknown id. */
export function getModelConfig(id: string): ModelConfig {
  const cfg = MODELS.find((m) => m.id === id);
  if (!cfg) throw new Error(`unknown model id: ${id}`);
  return cfg;
}
