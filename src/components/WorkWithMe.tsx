import styles from "./WorkWithMe.module.css";

export default function WorkWithMe() {
  const details = [
    ["OPEN TO", "Senior backend contracts (remote) · Full-time senior backend roles · Payment/fintech API integration · SaaS architecture"],
    ["STACK", "Node.js/TS · Laravel/PHP 8 · AWS (EC2/RDS/S3/App Runner) · Docker · Paystack · Polar.sh · VFD · Topupbox"],
    ["TIMEZONE", "WAT (UTC+1), Lagos, Nigeria · Onsite available: Victoria Island"],
    ["RESPONSE TIME", "< 24 hours"],
    ["NOT AVAILABLE FOR", "Maintenance-only work · unpaid trials · 'quick 5-min tasks'"],
  ];

  return (
    <section id="hire" className={styles.section}>
      <div className="container container--border">
        <p className="section-label">05 / WORK WITH ME</p>
        <div className={styles.grid}>
          <div className={styles.left}>
            <h2 className={styles.headline}>Let's build something real.</h2>
            <p className={styles.sub}>
              I work with startups and product teams that need a senior backend engineer
              who ships, communicates clearly, and doesn't disappear after onboarding.
              Open to both full-time roles and senior contracts.
            </p>
            <a href="mailto:obedugwuv@gmail.com" className={styles.cta}>
              obedugwuv@gmail.com →
            </a>
            <div className={styles.links}>
              <a href="https://github.com/UgwuObed" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                GitHub ↗
              </a>
              <a href="https://www.linkedin.com/in/obed-ugwu-81a568180/" target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                LinkedIn ↗
              </a>
            </div>
          </div>
          <div className={styles.right}>
            {details.map(([label, value]) => (
              <div key={label} className={styles.detailRow}>
                <p className={styles.detailLabel}>{label}</p>
                <p className={styles.detailValue}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
