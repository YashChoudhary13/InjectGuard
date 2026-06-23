/**
 * Model adapters — a unified runner over three providers. `fetch` is injected so
 * every adapter is unit-testable without real network calls. No SDKs: Groq and
 * OpenRouter speak the OpenAI chat-completions wire format; Gemini has its own.
 */

import { assertOpenRouterModelAllowed, type ModelConfig } from "./models";

export interface RunModelRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface RunModelResult {
  outputText: string;
  raw?: unknown;
}

export type ModelRunner = (req: RunModelRequest) => Promise<RunModelResult>;

interface AdapterOpts {
  apiKey: string;
  model: string;
  fetch?: typeof fetch;
}

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

/** Shared OpenAI-compatible chat call (Groq + OpenRouter). */
function openaiChat(url: string, opts: AdapterOpts, extraHeaders: Record<string, string> = {}): ModelRunner {
  const doFetch = opts.fetch ?? fetch;
  return async (req) => {
    const res = await doFetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${opts.apiKey}`,
        ...extraHeaders,
      },
      body: JSON.stringify({
        model: opts.model,
        temperature: req.temperature ?? 0,
        max_tokens: req.maxTokens ?? 512,
        messages: [
          { role: "system", content: req.systemPrompt },
          { role: "user", content: req.userPrompt },
        ],
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`model call failed (${res.status}): ${detail.slice(0, 200)}`);
    }
    const json: any = await res.json();
    return { outputText: json?.choices?.[0]?.message?.content ?? "", raw: json };
  };
}

export function createGroqAdapter(opts: AdapterOpts): ModelRunner {
  return openaiChat(GROQ_URL, opts);
}

export function createOpenRouterAdapter(opts: AdapterOpts): ModelRunner {
  // Guardrail BEFORE any network setup: refuse non-allowlisted models outright.
  assertOpenRouterModelAllowed(opts.model);
  return openaiChat(OPENROUTER_URL, opts, {
    "HTTP-Referer": "https://injectguard.local",
    "X-Title": "InjectGuard",
  });
}

export function createGeminiAdapter(opts: AdapterOpts): ModelRunner {
  const doFetch = opts.fetch ?? fetch;
  const url = `${GEMINI_BASE}/${opts.model}:generateContent?key=${opts.apiKey}`;
  return async (req) => {
    const res = await doFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: req.systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: req.userPrompt }] }],
        generationConfig: {
          temperature: req.temperature ?? 0,
          maxOutputTokens: req.maxTokens ?? 512,
        },
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`model call failed (${res.status}): ${detail.slice(0, 200)}`);
    }
    const json: any = await res.json();
    const text = (json?.candidates?.[0]?.content?.parts ?? [])
      .map((p: any) => p?.text ?? "")
      .join("");
    return { outputText: text, raw: json };
  };
}

/**
 * Build a runner from a ModelConfig, reading the key from `env`. Throws clearly
 * when the key is absent so a precompute run fails fast instead of billing/erroring.
 */
export function createRunnerForModel(
  cfg: ModelConfig,
  env: Record<string, string | undefined>,
  deps: { fetch?: typeof fetch } = {},
): ModelRunner {
  const apiKey = env[cfg.envVar];
  if (!apiKey) throw new Error(`missing ${cfg.envVar} for model ${cfg.id}`);
  const opts: AdapterOpts = { apiKey, model: cfg.model, fetch: deps.fetch };
  switch (cfg.provider) {
    case "groq":
      return createGroqAdapter(opts);
    case "google":
      return createGeminiAdapter(opts);
    case "openrouter":
      return createOpenRouterAdapter(opts);
  }
}
