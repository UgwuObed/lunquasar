import styles from "./Now.module.css";

const cards = [
  {
    tag: "BUILDING",
    title: "Token Radar",
    desc: "Real-time screener for token launches on Base blockchain. Goldsky substream pipelines, Alchemy webhooks, multi-signal risk scoring. Telegram-bot-first.",
    col: "#F0B429",
  },
  {
    tag: "STUDYING",
    title: "Senior Eng Prep",
    desc: "16-week plan: DSA Mon, System Design Tue, Node/TS Wed, Laravel Thu, AWS/DevOps Fri, Behavioral Sat. Week 4 of 16.",
    col: "#7b8cff",
  },
  {
    tag: "OPEN TO",
    title: "Senior Roles",
    desc: "Full-time remote senior backend roles and contracts. Fintech, SaaS, APIs. WAT timezone. Victoria Island onsite also available.",
    col: "#00e07a",
  },
];

export default function Now() {
  return (
    <section id="now" className={styles.section}>
      <div className="container container--border">
        <p className="section-label">04 / NOW</p>
        <div className={styles.titleRow}>
          <h2 className="section-title" style={{ marginBottom: 0 }}>What I&apos;m doing right now</h2>
          <span className={styles.timestamp}>Updated May 2026 · Lagos, Nigeria</span>
        </div>
        <div className={styles.cards}>
          {cards.map((c, i) => (
            <div key={i} className={styles.card} style={{ borderTopColor: c.col }}>
              <span className={styles.cardTag} style={{ color: c.col }}>{c.tag}</span>
              <h3 className={styles.cardTitle}>{c.title}</h3>
              <p className={styles.cardDesc}>{c.desc}</p>
            </div>
          ))}
        </div>
        <div className={styles.metrics}>
          <div className={styles.metricsLeft}>
            <p className={styles.metricsLabel}>LIVE METRICS: TOKEN RADAR</p>
            <p className={styles.metricsDesc}>
              Monitoring Base Mainnet pool creation events via Goldsky substream pipeline.
              Contabo VPS · Docker · nginx · Alchemy webhooks.
            </p>
          </div>
          <div className={styles.metricsStats}>
            {[["Base Mainnet", "LIVE"], ["Pools monitored", "∞"], ["Uptime", "99.9%"]].map(([l, v]) => (
              <div key={l} className={styles.metricsStat}>
                <p className={styles.metricsVal}>{v}</p>
                <p className={styles.metricsKey}>{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
