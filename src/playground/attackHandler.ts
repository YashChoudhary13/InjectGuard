import type { AttackPayload } from "../corpus/schema";
import type { VictimModel } from "../harness/runAttack";
import type { JudgeLlm } from "../judge/judge";
import { runAttack, type AttackResult } from "../harness/runAttack";
import { buildPoisonedContent } from "../harness/poison";
import { sanitize } from "../defense/sanitize";
import { makeCanary as defaultMakeCanary } from "../defense/canary";

export interface DemoPageRef {
  html: string;
  title: string;
}

export interface CustomPageInput {
  html: string;
  title: string;
}

export interface AttackHandlerInput {
  pageId?: string;
  customPage?: CustomPageInput;
  attackId: string;
  defense: boolean;
  modelId?: string;
}

export interface AttackHandlerDeps {
  getPage: (id: string) => DemoPageRef;
  getAttack: (id: string) => AttackPayload;
  victim: VictimModel;
  judgeLlm: JudgeLlm;
  /** Injectable for tests; defaults to the real crypto-based makeCanary. */
  makeCanary?: () => string;
}

export interface AttackHandlerResult extends AttackResult {
  pageTitle: string;
  /** Raw poisoned HTML — goes into the sandboxed iframe only. */
  poisonedContent: string;
  /** Sanitized text — shown as a comparison alongside the iframe. */
  sanitizedContent: string;
  report: AttackRunReport;
}

export interface AttackRunReport {
  generatedAt: string;
  pageTitle: string;
  attackId: string;
  technique: AttackPayload["technique"];
  goal: AttackPayload["goal"];
  modelId: string | null;
  defense: boolean;
  hijacked: boolean;
  method: AttackResult["method"];
  reason: string;
}

function resolvePage(input: AttackHandlerInput, getPage: AttackHandlerDeps["getPage"]): DemoPageRef {
  if (input.customPage && input.pageId) {
    throw new Error("Provide either pageId or customPage, not both");
  }
  if (input.customPage) {
    return input.customPage;
  }
  if (input.pageId) {
    return getPage(input.pageId);
  }
  throw new Error("Provide either pageId or customPage");
}

export async function handleAttack(
  input: AttackHandlerInput,
  deps: AttackHandlerDeps,
): Promise<AttackHandlerResult> {
  const page = resolvePage(input, deps.getPage);
  const payload = deps.getAttack(input.attackId);
  const makeCanary = deps.makeCanary ?? defaultMakeCanary;

  const canary = makeCanary();
  const poisoned = buildPoisonedContent(page.html, payload, canary);
  const sanitized = sanitize(poisoned);

  const result = await runAttack({
    cleanPage: page.html,
    payload,
    defense: input.defense,
    victim: deps.victim,
    judgeLlm: deps.judgeLlm,
    canary,
  });

  return {
    ...result,
    pageTitle: page.title,
    poisonedContent: poisoned,
    sanitizedContent: sanitized,
    report: {
      generatedAt: new Date().toISOString(),
      pageTitle: page.title,
      attackId: payload.id,
      technique: payload.technique,
      goal: payload.goal,
      modelId: input.modelId ?? null,
      defense: input.defense,
      hijacked: result.hijacked,
      method: result.method,
      reason: result.reason,
    },
  };
}
