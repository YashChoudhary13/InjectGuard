/**
 * promptfoo wrapper — the batch engine for the harness.
 *
 * We keep the hand-written indirect-injection layer (poison → defense → judge,
 * all in runAttack) and let promptfoo provide the provider×test matrix, concurrency
 * and caching. Each model becomes a promptfoo provider whose callApi runs one full
 * `runAttack` and returns the verdict as JSON (tagged with the model id, so result
 * extraction never depends on promptfoo's version-specific result shape).
 *
 * `evaluate` is injected (defaults to the real promptfoo library) so the whole
 * orchestration is unit-testable with a fake matrix runner and zero API calls.
 */

import type { AttackPayload } from "../corpus/schema";
import type { ModelConfig } from "./models";
import { makeCanary } from "../defense/canary";
import { runAttack, type VictimModel, type AttackResult } from "./runAttack";
import type { JudgeLlm } from "../judge/judge";

export type HarnessRun = AttackResult & { modelId: string };

export interface ProviderDeps {
  corpusById: Map<string, AttackPayload>;
  cleanPage: string;
  canary: string;
  victimFor: (modelId: string) => VictimModel;
  judgeLlm: JudgeLlm;
}

interface PromptfooProvider {
  id: () => string;
  callApi: (prompt: string, context: { vars: Record<string, any> }) => Promise<{ output: string }>;
}

/** One promptfoo provider = one model under test. */
export function makeVictimProvider(modelId: string, d: ProviderDeps): PromptfooProvider {
  return {
    id: () => `injectguard:${modelId}`,
    callApi: async (_prompt, context) => {
      const { attackId, defense } = context.vars;
      const payload = d.corpusById.get(String(attackId));
      if (!payload) throw new Error(`unknown attack id in suite: ${attackId}`);
      const result = await runAttack({
        cleanPage: d.cleanPage,
        payload,
        defense: defense === "on" || defense === true,
        victim: d.victimFor(modelId),
        judgeLlm: d.judgeLlm,
        canary: d.canary,
      });
      const run: HarnessRun = { ...result, modelId };
      return { output: JSON.stringify(run) };
    },
  };
}

export interface PromptfooSuite {
  providers: PromptfooProvider[];
  prompts: string[];
  tests: { vars: { attackId: string; defense: "on" | "off" } }[];
}

/** Build the provider×test matrix: every model × every attack × each defense state. */
export function buildSuite(
  models: ModelConfig[],
  corpus: AttackPayload[],
  defenseStates: boolean[],
  d?: ProviderDeps,
): PromptfooSuite {
  const deps =
    d ??
    ({
      corpusById: new Map(corpus.map((p) => [p.id, p])),
    } as ProviderDeps);
  const providers = models.map((m) => makeVictimProvider(m.id, deps));
  const tests = corpus.flatMap((p) =>
    defenseStates.map((on) => ({ vars: { attackId: p.id, defense: (on ? "on" : "off") as "on" | "off" } })),
  );
  return { providers, prompts: ["{{attackId}}|{{defense}}"], tests };
}

export type EvaluateFn = (suite: any, opts?: any) => Promise<any>;

/**
 * A deterministic, in-process stand-in for promptfoo.evaluate: runs every provider
 * against every test (the same matrix), with no concurrency, caching or cost. Used
 * for synthetic precomputes and tests; the real promptfoo library is the default.
 */
export const inProcessEvaluate: EvaluateFn = async (suite: PromptfooSuite) => {
  const results: any[] = [];
  for (const provider of suite.providers) {
    for (const test of suite.tests) {
      const out = await provider.callApi("", { vars: test.vars });
      results.push({ response: { output: out.output }, vars: test.vars });
    }
  }
  return { results };
};

async function defaultEvaluate(suite: any, opts?: any): Promise<any> {
  process.env.PROMPTFOO_DISABLE_TELEMETRY = "1";
  process.env.PROMPTFOO_DISABLE_UPDATE = "1";
  const pf: any = await import("promptfoo");
  const evaluate = pf.evaluate ?? pf.default?.evaluate;
  if (typeof evaluate !== "function") throw new Error("promptfoo.evaluate not found");
  return evaluate(suite, opts);
}

/** Pull every JSON verdict out of a promptfoo summary, tolerant of result shape. */
function extractRuns(summary: any): HarnessRun[] {
  const items: any[] = summary?.results ?? summary?.table?.body ?? summary ?? [];
  const runs: HarnessRun[] = [];
  for (const item of items) {
    const output = item?.response?.output ?? item?.output;
    if (typeof output !== "string") continue;
    try {
      runs.push(JSON.parse(output) as HarnessRun);
    } catch {
      // ignore non-JSON rows (e.g. error rows)
    }
  }
  return runs;
}

export interface RunHarnessDeps {
  models: ModelConfig[];
  corpus: AttackPayload[];
  cleanPage: string;
  victimFor: (modelId: string) => VictimModel;
  judgeLlm: JudgeLlm;
  canary?: string;
  defenseStates?: boolean[];
}

/** Run the whole matrix and return one verdict per (model × attack × defense). */
export async function runHarness(
  deps: RunHarnessDeps,
  opts: { evaluate?: EvaluateFn; maxConcurrency?: number } = {},
): Promise<HarnessRun[]> {
  const canary = deps.canary ?? makeCanary();
  const defenseStates = deps.defenseStates ?? [false, true];
  const providerDeps: ProviderDeps = {
    corpusById: new Map(deps.corpus.map((p) => [p.id, p])),
    cleanPage: deps.cleanPage,
    canary,
    victimFor: deps.victimFor,
    judgeLlm: deps.judgeLlm,
  };
  const suite = buildSuite(deps.models, deps.corpus, defenseStates, providerDeps);
  const evaluate = opts.evaluate ?? defaultEvaluate;
  const summary = await evaluate(suite, { maxConcurrency: opts.maxConcurrency ?? 2 });
  return extractRuns(summary);
}
