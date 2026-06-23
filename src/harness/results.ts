/**
 * results.json schema + aggregation. The leaderboard precompute writes this file;
 * the UI imports it statically. `aggregate()` is pure so it's fully unit-tested.
 *
 * Convention: a "success" is a *successful attack* (the model was hijacked). The
 * defense should drive that rate down, so delta = successRateOff - successRateOn
 * is the improvement from turning the defense on (higher = better defense).
 */

import type { ModelConfig } from "./models";
import type { HarnessRun } from "./promptfooRunner";

export interface TechniqueStat {
  technique: string;
  attacks: number;
  hijackedOff: number;
  hijackedOn: number;
  successRateOff: number;
  successRateOn: number;
  delta: number;
}

export interface ModelStat {
  id: string;
  label: string;
  provider: string;
  model: string;
  attacks: number;
  hijackedOff: number;
  hijackedOn: number;
  successRateOff: number;
  successRateOn: number;
  delta: number;
  byTechnique: TechniqueStat[];
}

export interface CompactRun {
  modelId: string;
  attackId: string;
  technique: string;
  goal: string;
  defense: boolean;
  hijacked: boolean;
  method: string;
}

export interface ResultsFile {
  schemaVersion: 1;
  generatedAt: string;
  mode: "synthetic" | "live";
  judgeModel: string;
  attackCount: number;
  models: ModelStat[];
  runs: CompactRun[];
}

export interface AggregateMeta {
  mode: "synthetic" | "live";
  judgeModel: string;
  generatedAt: string;
}

const round4 = (n: number) => Math.round(n * 1e4) / 1e4;
const rate = (hijacked: number, total: number) => (total === 0 ? 0 : round4(hijacked / total));

interface Tally {
  attacks: Set<string>;
  hijackedOff: number;
  hijackedOn: number;
  offCount: number;
  onCount: number;
}

const emptyTally = (): Tally => ({
  attacks: new Set(),
  hijackedOff: 0,
  hijackedOn: 0,
  offCount: 0,
  onCount: 0,
});

function add(t: Tally, r: HarnessRun): void {
  t.attacks.add(r.id);
  if (r.defense) {
    t.onCount++;
    if (r.hijacked) t.hijackedOn++;
  } else {
    t.offCount++;
    if (r.hijacked) t.hijackedOff++;
  }
}

function statFrom(t: Tally) {
  const successRateOff = rate(t.hijackedOff, t.offCount);
  const successRateOn = rate(t.hijackedOn, t.onCount);
  return {
    attacks: t.attacks.size,
    hijackedOff: t.hijackedOff,
    hijackedOn: t.hijackedOn,
    successRateOff,
    successRateOn,
    delta: round4(successRateOff - successRateOn),
  };
}

export function aggregate(runs: HarnessRun[], models: ModelConfig[], meta: AggregateMeta): ResultsFile {
  const modelStats: ModelStat[] = models.map((cfg) => {
    const mine = runs.filter((r) => r.modelId === cfg.id);
    const overall = emptyTally();
    const byTech = new Map<string, Tally>();
    for (const r of mine) {
      add(overall, r);
      if (!byTech.has(r.technique)) byTech.set(r.technique, emptyTally());
      add(byTech.get(r.technique)!, r);
    }
    return {
      id: cfg.id,
      label: cfg.label,
      provider: cfg.provider,
      model: cfg.model,
      ...statFrom(overall),
      byTechnique: [...byTech.entries()]
        .map(([technique, t]) => ({ technique, ...statFrom(t) }))
        .sort((a, b) => a.technique.localeCompare(b.technique)),
    };
  });

  const compactRuns: CompactRun[] = runs.map((r) => ({
    modelId: r.modelId,
    attackId: r.id,
    technique: r.technique,
    goal: r.goal,
    defense: r.defense,
    hijacked: r.hijacked,
    method: r.method,
  }));

  return {
    schemaVersion: 1,
    generatedAt: meta.generatedAt,
    mode: meta.mode,
    judgeModel: meta.judgeModel,
    attackCount: new Set(runs.map((r) => r.id)).size,
    models: modelStats.sort((a, b) => a.successRateOn - b.successRateOn || a.id.localeCompare(b.id)),
    runs: compactRuns,
  };
}
