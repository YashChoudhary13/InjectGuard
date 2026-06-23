import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import resultsData from "../data/results.json";
import type { ResultsFile, ModelStat, TechniqueStat } from "../src/harness/results";

const pct = (n: number) => `${Math.round(n * 100)}%`;
const day = (iso: string) => iso.slice(0, 10);

/** Most robust first: lowest hijack rate with the defense ON, then OFF. */
function ranked(models: ModelStat[]): ModelStat[] {
  return [...models].sort((a, b) => a.successRateOn - b.successRateOn || a.successRateOff - b.successRateOff);
}

function Gauge({ m }: { m: ModelStat }) {
  const blockedOn = 1 - m.successRateOn;
  return (
    <div className="gauge gaugecell">
      <div className="track off">
        <span style={{ width: pct(m.successRateOff) }} />
      </div>
      <div className="track on">
        <span style={{ width: pct(blockedOn) }} />
      </div>
      <div className="gaugelabel">
        <span>off · {pct(m.successRateOff)} hijacked</span>
        <span>on · {pct(blockedOn)} blocked</span>
      </div>
    </div>
  );
}

function TechniqueRow({ t }: { t: TechniqueStat }) {
  const blocked = t.successRateOn === 0;
  return (
    <tr>
      <td>{t.technique}</td>
      <td className="n">{t.attacks}</td>
      <td className="n" style={{ color: "var(--red)" }}>
        {pct(t.successRateOff)}
      </td>
      <td className="n" style={{ color: t.successRateOn > 0 ? "var(--red)" : "var(--mut)" }}>
        {pct(t.successRateOn)}
      </td>
      <td className="n" style={{ color: "var(--grn)" }}>
        {pct(t.delta)}
      </td>
      <td>
        <span className={`chip ${blocked ? "blocked" : "hijacked"}`}>
          {blocked ? "✓ blocked" : "✕ bypassed"}
        </span>
      </td>
    </tr>
  );
}

export default function Leaderboard({ results }: { results: ResultsFile }) {
  const models = ranked(results.models);

  return (
    <>
      <Head>
        <title>Leaderboard — InjectGuard</title>
      </Head>

      <div className="statusbar">
        <div className="wrap row">
          <Link href="/" className="brand" style={{ borderBottom: "none" }}>
            INJECTGUARD
          </Link>
          <span>ROBUSTNESS LEADERBOARD</span>
          <span className="spacer" />
          <span>BUILD {day(results.generatedAt)}</span>
        </div>
      </div>

      <main className="wrap">
        <section className="head">
          <p className="kicker">Indirect prompt injection · defense OFF vs ON</p>
          <h1>
            Robustness <span className="sig">leaderboard</span>
          </h1>
          <p className="lede">
            Each model reads a page poisoned with a hidden instruction. We measure the attack
            success rate with the defense off, then on. The delta is how much the defense helped.
          </p>
        </section>

        <div className="readout">
          <span>
            <b>{results.models.length}</b> models
          </span>
          <span>
            <b>{results.attackCount}</b> attacks
          </span>
          <span>
            judge <b>{results.judgeModel}</b>
          </span>
          <span>
            tested <b>{day(results.generatedAt)}</b>
          </span>
          <span>
            mode <b>{results.mode}</b>
          </span>
        </div>

        {results.mode === "synthetic" ? (
          <div className="banner">
            ⚠ SYNTHETIC DATA — deterministic simulation, not real model measurements. Run{" "}
            <code>npm run precompute:live</code> to populate this with the real cheap models.
          </div>
        ) : (
          <div className="banner live">✓ LIVE DATA — measured against real models.</div>
        )}

        <section className="board">
          <div className="colhead">
            <span>#</span>
            <span>MODEL</span>
            <span>DEFENSE OFF → ON</span>
            <span className="num">HIJACKED ON</span>
            <span className="num">Δ DEFENSE</span>
          </div>
          {models.map((m, i) => (
            <div key={m.id} className={`lbrow ${i === 0 ? "top" : ""}`}>
              <span className="rank">{String(i + 1).padStart(2, "0")}</span>
              <span className="model">
                <span className="name">{m.label}</span>
                <br />
                <span className="meta">
                  {m.provider} · {m.model}
                </span>
              </span>
              <Gauge m={m} />
              <span className={`num ${m.successRateOn > 0 ? "red" : "grn"} deltacell`}>
                {pct(m.successRateOn)}
              </span>
              <span className="num grn deltacell">{pct(m.delta)}</span>
            </div>
          ))}
        </section>

        {models.map((m) => (
          <details className="tech" key={m.id}>
            <summary>{m.label} · per-technique breakdown</summary>
            <table>
              <thead>
                <tr>
                  <th>Technique</th>
                  <th style={{ textAlign: "right" }}>Attacks</th>
                  <th style={{ textAlign: "right" }}>Hijacked OFF</th>
                  <th style={{ textAlign: "right" }}>Hijacked ON</th>
                  <th style={{ textAlign: "right" }}>Δ</th>
                  <th>Verdict ON</th>
                </tr>
              </thead>
              <tbody>
                {m.byTechnique.map((t) => (
                  <TechniqueRow key={t.technique} t={t} />
                ))}
              </tbody>
            </table>
          </details>
        ))}
      </main>

      <footer className="wrap">
        Precomputed offline · committed results.json · the site never calls a model at request time.
      </footer>
    </>
  );
}

export const getStaticProps: GetStaticProps<{ results: ResultsFile }> = async () => {
  // Static data load at build time — never an in-request precompute (Vercel 60s limit).
  return { props: { results: resultsData as unknown as ResultsFile } };
};
