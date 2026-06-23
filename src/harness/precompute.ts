/**
 * Precompute core — runs the full matrix and aggregates it into a ResultsFile.
 * Pure orchestration: all model/judge/evaluate I/O is injected, so the dry-run
 * test drives the whole thing with simulated adapters and zero cost. The CLI
 * (scripts/precomputeLeaderboard.ts) wires either the simulation or real adapters.
 */

import type { ModelConfig } from "./models";
import type { AttackPayload } from "../corpus/schema";
import type { VictimModel } from "./runAttack";
import type { JudgeLlm } from "../judge/judge";
import { runHarness, type EvaluateFn } from "./promptfooRunner";
import { aggregate, type ResultsFile } from "./results";

export interface PrecomputeDeps {
  models: ModelConfig[];
  corpus: AttackPayload[];
  cleanPage: string;
  victimFor: (modelId: string) => VictimModel;
  judgeLlm: JudgeLlm;
  mode: "synthetic" | "live";
  judgeModel: string;
  generatedAt: string;
  canary?: string;
  defenseStates?: boolean[];
  evaluate?: EvaluateFn;
  maxConcurrency?: number;
}

export async function precompute(deps: PrecomputeDeps): Promise<ResultsFile> {
  const runs = await runHarness(
    {
      models: deps.models,
      corpus: deps.corpus,
      cleanPage: deps.cleanPage,
      victimFor: deps.victimFor,
      judgeLlm: deps.judgeLlm,
      canary: deps.canary,
      defenseStates: deps.defenseStates,
    },
    { evaluate: deps.evaluate, maxConcurrency: deps.maxConcurrency },
  );
  return aggregate(runs, deps.models, {
    mode: deps.mode,
    judgeModel: deps.judgeModel,
    generatedAt: deps.generatedAt,
  });
}
