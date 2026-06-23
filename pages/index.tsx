import Link from "next/link";
import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>InjectGuard — indirect prompt-injection lab</title>
        <meta
          name="description"
          content="An AI obeyed an instruction you couldn't even see. InjectGuard measures exactly how often — and proves a defense that stops it."
        />
      </Head>

      <div className="statusbar">
        <div className="wrap row">
          <span className="brand">INJECTGUARD</span>
          <span>INDIRECT PROMPT-INJECTION LAB</span>
          <span className="spacer" />
          <span className="dot" /> <span>LIVE</span>
        </div>
      </div>

      <main className="wrap">
        <section className="head">
          <p className="kicker">AI security · LLM red-teaming</p>
          <h1>
            An AI obeyed an instruction
            <br />
            you couldn't <span className="sig">see</span>.
          </h1>
          <p className="lede">
            InjectGuard plants hidden attacks inside the pages an AI reads, measures how often each
            model gets hijacked, and proves a defense that stops it.
          </p>
          <p style={{ marginTop: 28 }}>
            <Link href="/leaderboard">→ View the robustness leaderboard</Link>
            &nbsp;&nbsp;·&nbsp;&nbsp;
            <Link href="/playground">→ Try the live playground</Link>
          </p>
        </section>
      </main>

      <footer className="wrap">InjectGuard · portfolio build · TypeScript end-to-end</footer>
    </>
  );
}
