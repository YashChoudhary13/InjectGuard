import type { AttackHandlerInput, CustomPageInput } from "./attackHandler";

const MAX_CUSTOM_TITLE_CHARS = 120;
const MAX_CUSTOM_HTML_CHARS = 20_000;

export interface ParsedAttackRequest extends AttackHandlerInput {
  attackId: string;
  modelId: string;
  defense: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readCustomPage(value: unknown): CustomPageInput {
  if (!isRecord(value)) {
    throw new Error("customPage must include title and html");
  }

  const rawTitle = typeof value.title === "string" ? value.title.trim() : "";
  const title = rawTitle || "Custom page";
  const html = typeof value.html === "string" ? value.html.trim() : "";

  if (title.length > MAX_CUSTOM_TITLE_CHARS) {
    throw new Error("customPage.title must be 120 characters or fewer");
  }
  if (!html) {
    throw new Error("customPage.html is required");
  }
  if (html.length > MAX_CUSTOM_HTML_CHARS) {
    throw new Error("customPage.html must be 20000 characters or fewer");
  }

  return { title, html };
}

export function parseAttackRequest(body: unknown): ParsedAttackRequest {
  if (!isRecord(body)) {
    throw new Error("Missing or invalid fields: attackId, modelId, defense");
  }

  const { pageId, customPage, attackId, modelId, defense } = body;
  if (typeof attackId !== "string" || typeof modelId !== "string" || typeof defense !== "boolean") {
    throw new Error("Missing or invalid fields: attackId, modelId, defense");
  }

  const normalizedPageId = typeof pageId === "string" ? pageId.trim() : "";
  const hasPageId = normalizedPageId.length > 0;
  const hasCustomPage = customPage !== undefined;

  if (hasPageId && hasCustomPage) {
    throw new Error("Provide either pageId or customPage, not both");
  }
  if (!hasPageId && !hasCustomPage) {
    throw new Error("Provide either pageId or customPage");
  }

  const base = { attackId, modelId, defense };
  if (hasCustomPage) {
    return { ...base, customPage: readCustomPage(customPage) };
  }
  return { ...base, pageId: normalizedPageId };
}
