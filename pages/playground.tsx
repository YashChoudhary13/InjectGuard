import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { DEMO_PAGES } from "../src/playground/demoPages";
import { MODELS } from "../src/harness/models";
import attacks from "../src/corpus/attacks.json";
import type { AttackHandlerResult } from "../src/playground/attackHandler";

type ApiResult = AttackHandlerResult | { error: string };
type PageSource = "demo" | "custom";

const TECHNIQUE_LABELS: Record<string, string> = {
  "hidden-text": "Hidden text",
  "html-comment": "HTML comment",
  markdown: "Markdown alt-text",
  "unicode-smuggling": "Unicode smuggling",
  "instruction-in-data": "Instruction in data",
};

const GOAL_LABELS: Record<string, string> = {
  "instruction-override": "Override instructions",
  "canary-exfiltration": "Exfiltrate secret token",
  "link-injection": "Inject attacker link",
};

export default function Playground() {
  const [pageSource, setPageSource] = useState<PageSource>("demo");
  const [pageId, setPageId] = useState(DEMO_PAGES[0].id);
  const [customTitle, setCustomTitle] = useState("");
  const [customHtml, setCustomHtml] = useState("");
  const [attackId, setAttackId] = useState(attacks[0].id);
  const [modelId, setModelId] = useState(MODELS[0].id);
  const [defense, setDefense] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [reportCopied, setReportCopied] = useState(false);

  const reportJson =
    result && !("error" in result) ? JSON.stringify((result as AttackHandlerResult).report, null, 2) : "";

  const runAttack = async () => {
    if (pageSource === "custom" && !customHtml.trim()) {
      setResult({ error: "Paste HTML or page text before running a custom page test." });
      return;
    }

    setRunning(true);
    setResult(null);
    setReportCopied(false);
    try {
      const pagePayload =
        pageSource === "custom"
          ? { customPage: { title: customTitle, html: customHtml } }
          : { pageId };
      const res = await fetch("/api/attack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pagePayload, attackId, modelId, defense }),
      });
      const json = await res.json();
      setResult(json);
    } catch {
      setResult({ error: "Network error — could not reach the server." });
    } finally {
      setRunning(false);
    }
  };

  const copyReport = async () => {
    if (!reportJson) return;
    await navigator.clipboard.writeText(reportJson);
    setReportCopied(true);
  };

  const downloadReport = () => {
    if (!reportJson) return;
    const blob = new Blob([reportJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `injectguard-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ok = result && !("error" in result);
  const err = result && "error" in result ? result.error : null;
  const r = ok ? (result as AttackHandlerResult) : null;

  return (
    <>
      <Head>
        <title>Playground — InjectGuard</title>
        <meta
          name="description"
          content="Run a live indirect prompt-injection attack and watch the defense block it — or not."
        />
      </Head>

      <div className="statusbar">
        <div className="wrap row">
          <span className="brand">INJECTGUARD</span>
          <span>PLAYGROUND</span>
          <span className="spacer" />
          <span className="dot" />
          <span>LIVE</span>
        </div>
      </div>

      <main className="wrap">
        <section className="head">
          <p className="kicker">AI security · live attack demo</p>
          <h1>
            Watch an AI get <span className="sig">hijacked</span> — or not
          </h1>
          <p className="lede">
            Pick a page, an attack, and a model. Toggle the defense. One click plants the
            injection, runs the victim model, and judges the outcome.
          </p>
        </section>

        {/* Controls */}
        <div className="pg-controls">
          <div className="pg-field">
            <span className="pg-label">Page source</span>
            <div className="pg-toggle" role="group" aria-label="Page source">
              <button
                className={`pg-toggle-btn${pageSource === "demo" ? " active" : ""}`}
                onClick={() => setPageSource("demo")}
                disabled={running}
                aria-pressed={pageSource === "demo"}
              >
                DEMO
              </button>
              <button
                className={`pg-toggle-btn${pageSource === "custom" ? " active" : ""}`}
                onClick={() => setPageSource("custom")}
                disabled={running}
                aria-pressed={pageSource === "custom"}
              >
                YOUR PAGE
              </button>
            </div>
          </div>

          {pageSource === "demo" && (
            <div className="pg-field">
              <label className="pg-label" htmlFor="pg-page">Page</label>
              <select
                id="pg-page"
                className="pg-select"
                value={pageId}
                onChange={(e) => setPageId(e.target.value)}
                disabled={running}
              >
                {DEMO_PAGES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {pageSource === "custom" && (
            <div className="pg-custom">
              <div className="pg-field">
                <label className="pg-label" htmlFor="pg-custom-title">Custom page title</label>
                <input
                  id="pg-custom-title"
                  className="pg-input"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Pricing page"
                  maxLength={120}
                  disabled={running}
                />
              </div>
              <div className="pg-field pg-field--wide">
                <label className="pg-label" htmlFor="pg-custom-html">Paste HTML or page text</label>
                <textarea
                  id="pg-custom-html"
                  className="pg-textarea"
                  value={customHtml}
                  onChange={(e) => setCustomHtml(e.target.value)}
                  placeholder="<main>Paste the website HTML or visible page text here...</main>"
                  maxLength={20000}
                  disabled={running}
                />
                <span className="pg-help">{customHtml.length}/20000 chars · no URLs fetched server-side</span>
              </div>
            </div>
          )}

          <div className="pg-field">
            <label className="pg-label" htmlFor="pg-attack">Attack</label>
            <select
              id="pg-attack"
              className="pg-select"
              value={attackId}
              onChange={(e) => setAttackId(e.target.value)}
              disabled={running}
            >
              {attacks.map((a) => (
                <option key={a.id} value={a.id}>
                  {TECHNIQUE_LABELS[a.technique] ?? a.technique} · {GOAL_LABELS[a.goal] ?? a.goal}
                </option>
              ))}
            </select>
          </div>

          <div className="pg-field">
            <label className="pg-label" htmlFor="pg-model">Model</label>
            <select
              id="pg-model"
              className="pg-select"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              disabled={running}
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="pg-field pg-field--toggle">
            <span className="pg-label">Defense</span>
            <div className="pg-toggle" role="group" aria-label="Defense toggle">
              <button
                className={`pg-toggle-btn${!defense ? " active" : ""}`}
                onClick={() => setDefense(false)}
                disabled={running}
                aria-pressed={!defense}
              >
                OFF
              </button>
              <button
                className={`pg-toggle-btn${defense ? " active" : ""}`}
                onClick={() => setDefense(true)}
                disabled={running}
                aria-pressed={defense}
              >
                ON
              </button>
            </div>
          </div>

          <div className="pg-field pg-field--run">
            <button className="pg-run" onClick={runAttack} disabled={running}>
              {running ? "RUNNING…" : "▶ RUN ATTACK"}
            </button>
          </div>
        </div>

        {/* Error */}
        {err && (
          <div className="banner" style={{ borderColor: "var(--red)", color: "var(--red)" }}>
            ERROR — {err}
          </div>
        )}

        {/* Result */}
        {r && (
          <div className="pg-result">
            {/* Left: poisoned page iframe + sanitized diff */}
            <div className="pg-left">
              <p className="pg-section-label">
                POISONED PAGE <span className="pg-dim">— looks clean to a human</span>
              </p>
              {/* SECURITY: poisoned HTML renders ONLY inside a sandboxed iframe.
                  sandbox="" disables all capabilities: no scripts, no forms,
                  no same-origin access. Never inject srcdoc content into the main DOM. */}
              <iframe
                className="pg-iframe"
                sandbox=""
                srcDoc={r.poisonedContent}
                title="Poisoned page (sandboxed)"
              />

              {r.defense && (
                <>
                  <p className="pg-section-label" style={{ marginTop: 16 }}>
                    AFTER DEFENSE STRIPS IT
                  </p>
                  <pre className="pg-pre">{r.sanitizedContent}</pre>
                </>
              )}
            </div>

            {/* Right: verdict + response */}
            <div className="pg-right">
              <p className="pg-section-label">VERDICT</p>
              <div className="pg-verdict-row">
                <span className={`chip ${r.hijacked ? "hijacked" : "blocked"}`}>
                  {r.hijacked ? "✕ hijacked" : "✓ blocked"}
                </span>
                <span className="pg-method">via {r.method}</span>
              </div>
              <p className="pg-reason">{r.reason}</p>

              <p className="pg-section-label" style={{ marginTop: 20 }}>
                MODEL RESPONSE
              </p>
              <pre className="pg-pre pg-response">{r.response}</pre>

              <p className="pg-section-label" style={{ marginTop: 20 }}>
                ATTACK METADATA
              </p>
              <table className="pg-meta">
                <tbody>
                  <tr>
                    <td className="pg-meta-k">Technique</td>
                    <td>{r.technique}</td>
                  </tr>
                  <tr>
                    <td className="pg-meta-k">Goal</td>
                    <td>{r.goal}</td>
                  </tr>
                  <tr>
                    <td className="pg-meta-k">Defense</td>
                    <td>{r.defense ? "ON" : "OFF"}</td>
                  </tr>
                  <tr>
                    <td className="pg-meta-k">Page</td>
                    <td>{r.pageTitle}</td>
                  </tr>
                </tbody>
              </table>

              <p className="pg-section-label" style={{ marginTop: 20 }}>
                TEST REPORT
              </p>
              <div className="pg-report-actions">
                <button className="pg-report-btn" onClick={copyReport}>
                  {reportCopied ? "COPIED" : "COPY JSON"}
                </button>
                <button className="pg-report-btn" onClick={downloadReport}>
                  DOWNLOAD JSON
                </button>
              </div>
              <pre className="pg-pre pg-report">{reportJson}</pre>
            </div>
          </div>
        )}

        {/* Initial empty state */}
        {!r && !err && !running && (
          <div className="pg-empty">
            <p>Select options above and click ▶ RUN ATTACK to start.</p>
            <p className="pg-dim">
              Paste your own HTML/text or use a curated demo. Each run calls the real model — one
              billed request per click.
            </p>
          </div>
        )}
      </main>

      <footer className="wrap">
        <Link href="/leaderboard">← Leaderboard</Link>
        &nbsp;&nbsp;·&nbsp;&nbsp; InjectGuard · portfolio build · TypeScript end-to-end
      </footer>
    </>
  );
}
