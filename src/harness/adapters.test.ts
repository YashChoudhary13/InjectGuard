import { describe, it, expect, vi } from "vitest";
import {
  createGroqAdapter,
  createGeminiAdapter,
  createOpenRouterAdapter,
  createRunnerForModel,
} from "./adapters";
import { getModelConfig, OPENROUTER_ALLOWED_MODELS } from "./models";

/** A fake fetch returning an OpenAI-shaped chat completion. */
function openaiFetch(content: string) {
  return vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ choices: [{ message: { content } }] }),
  })) as unknown as typeof fetch;
}

/** A fake fetch returning a Gemini-shaped generateContent response. */
function geminiFetch(text: string) {
  return vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }),
  })) as unknown as typeof fetch;
}

const REQ = { systemPrompt: "be safe", userPrompt: "hello" };

describe("createGroqAdapter", () => {
  it("posts an OpenAI-style chat completion with bearer auth and returns the text", async () => {
    const fetch = openaiFetch("hi from llama");
    const run = createGroqAdapter({ apiKey: "k-groq", model: "llama-x", fetch });
    const res = await run(REQ);

    expect(res.outputText).toBe("hi from llama");
    const [url, init] = (fetch as any).mock.calls[0];
    expect(url).toContain("groq.com");
    expect((init.headers as any).Authorization).toBe("Bearer k-groq");
    const body = JSON.parse(init.body);
    expect(body.model).toBe("llama-x");
    expect(body.messages[0]).toMatchObject({ role: "system", content: "be safe" });
    expect(body.messages[1]).toMatchObject({ role: "user", content: "hello" });
  });

  it("throws on a non-2xx response", async () => {
    const fetch = vi.fn(async () => ({ ok: false, status: 429, text: async () => "rate limited" })) as unknown as typeof globalThis.fetch;
    const run = createGroqAdapter({ apiKey: "k", model: "llama-x", fetch });
    await expect(run(REQ)).rejects.toThrow(/429/);
  });
});

describe("createGeminiAdapter", () => {
  it("calls generateContent with the key and parses candidates text", async () => {
    const fetch = geminiFetch("hi from gemini");
    const run = createGeminiAdapter({ apiKey: "k-gem", model: "gemini-flash-x", fetch });
    const res = await run(REQ);

    expect(res.outputText).toBe("hi from gemini");
    const [url, init] = (fetch as any).mock.calls[0];
    expect(url).toContain("generativelanguage.googleapis.com");
    expect(url).toContain("gemini-flash-x");
    expect(url).toContain("k-gem");
    const body = JSON.parse(init.body);
    // system instruction + user content present
    expect(JSON.stringify(body)).toContain("be safe");
    expect(JSON.stringify(body)).toContain("hello");
  });
});

describe("createOpenRouterAdapter (guardrail)", () => {
  it("works for the allowlisted DeepSeek model", async () => {
    const fetch = openaiFetch("hi from deepseek");
    const run = createOpenRouterAdapter({ apiKey: "k", model: OPENROUTER_ALLOWED_MODELS[0], fetch });
    const res = await run(REQ);
    expect(res.outputText).toBe("hi from deepseek");
    expect((fetch as any).mock.calls[0][0]).toContain("openrouter.ai");
  });

  it("refuses a non-allowlisted model WITHOUT making a network call", () => {
    const fetch = vi.fn() as unknown as typeof globalThis.fetch;
    expect(() => createOpenRouterAdapter({ apiKey: "k", model: "openai/gpt-4o", fetch })).toThrow();
    expect((fetch as any)).not.toHaveBeenCalled();
  });
});

describe("createRunnerForModel", () => {
  it("throws a clear error when the model's env var is missing", () => {
    const cfg = getModelConfig("groq-llama");
    expect(() => createRunnerForModel(cfg, {}, { fetch: openaiFetch("x") })).toThrow(new RegExp(cfg.envVar));
  });

  it("dispatches to the configured provider's endpoint", async () => {
    const cfg = getModelConfig("groq-llama");
    const fetch = openaiFetch("ok");
    const run = createRunnerForModel(cfg, { [cfg.envVar]: "secret" }, { fetch });
    await run(REQ);
    expect((fetch as any).mock.calls[0][0]).toContain("groq.com");
  });
});
