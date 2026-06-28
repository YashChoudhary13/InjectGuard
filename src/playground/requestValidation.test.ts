import { describe, expect, it } from "vitest";
import { parseAttackRequest } from "./requestValidation";

describe("parseAttackRequest", () => {
  it("accepts a demo page request", () => {
    const parsed = parseAttackRequest({
      pageId: "recipe-page",
      attackId: "hidden-text-01",
      modelId: "groq-llama",
      defense: false,
    });

    expect(parsed).toEqual({
      pageId: "recipe-page",
      attackId: "hidden-text-01",
      modelId: "groq-llama",
      defense: false,
    });
  });

  it("accepts and trims a custom page request", () => {
    const parsed = parseAttackRequest({
      customPage: { title: "  Docs Page  ", html: "  <h1>Docs</h1>  " },
      attackId: "hidden-text-01",
      modelId: "groq-llama",
      defense: true,
    });

    expect(parsed).toEqual({
      customPage: { title: "Docs Page", html: "<h1>Docs</h1>" },
      attackId: "hidden-text-01",
      modelId: "groq-llama",
      defense: true,
    });
  });

  it("uses Custom page when custom title is blank", () => {
    const parsed = parseAttackRequest({
      customPage: { title: " ", html: "Body text" },
      attackId: "hidden-text-01",
      modelId: "groq-llama",
      defense: false,
    });

    expect(parsed.customPage?.title).toBe("Custom page");
  });

  it("rejects requests with both pageId and customPage", () => {
    expect(() =>
      parseAttackRequest({
        pageId: "recipe-page",
        customPage: { title: "Docs", html: "<p>Docs</p>" },
        attackId: "hidden-text-01",
        modelId: "groq-llama",
        defense: false,
      }),
    ).toThrow("Provide either pageId or customPage, not both");
  });

  it("rejects requests with no page source", () => {
    expect(() =>
      parseAttackRequest({
        attackId: "hidden-text-01",
        modelId: "groq-llama",
        defense: false,
      }),
    ).toThrow("Provide either pageId or customPage");
  });

  it("rejects empty custom page html", () => {
    expect(() =>
      parseAttackRequest({
        customPage: { title: "Docs", html: "   " },
        attackId: "hidden-text-01",
        modelId: "groq-llama",
        defense: false,
      }),
    ).toThrow("customPage.html is required");
  });

  it("rejects long custom page html", () => {
    expect(() =>
      parseAttackRequest({
        customPage: { title: "Docs", html: "x".repeat(20_001) },
        attackId: "hidden-text-01",
        modelId: "groq-llama",
        defense: false,
      }),
    ).toThrow("customPage.html must be 20000 characters or fewer");
  });

  it("rejects long custom page titles", () => {
    expect(() =>
      parseAttackRequest({
        customPage: { title: "x".repeat(121), html: "<p>Docs</p>" },
        attackId: "hidden-text-01",
        modelId: "groq-llama",
        defense: false,
      }),
    ).toThrow("customPage.title must be 120 characters or fewer");
  });

  it("rejects invalid scalar fields", () => {
    expect(() =>
      parseAttackRequest({
        pageId: "recipe-page",
        attackId: "hidden-text-01",
        modelId: 123,
        defense: false,
      }),
    ).toThrow("Missing or invalid fields: attackId, modelId, defense");
  });
});
