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

export interface AttackHandlerInput {
  pageId: string;
  attackId: string;
  defense: boolean;
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
}

export async function handleAttack(
  input: AttackHandlerInput,
  deps: AttackHandlerDeps,
): Promise<AttackHandlerResult> {
  const page = deps.getPage(input.pageId);
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
  };
}
