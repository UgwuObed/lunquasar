"use client";
import { useState } from "react";
import { experience } from "@/data/experience";
import styles from "./Experience.module.css";

export default function Experience() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="experience" className={styles.section}>
      <div className="container container--border">
        <p className="section-label">02 / EXPERIENCE</p>
        <h2 className="section-title">Where I've worked</h2>
        <div className={styles.list}>
          {experience.map((job, i) => (
            <ExperienceRow
              key={i}
              job={job}
              isOpen={open === i}
              onToggle={() => setOpen(open === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ExperienceRow({
  job,
  isOpen,
  onToggle,
}: {
  job: typeof experience[0];
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={`${styles.row} ${isOpen ? styles.rowOpen : ""}`}>
      <button className={styles.header} onClick={onToggle}>
        <div className={styles.headerLeft}>
          <div className={styles.titleRow}>
            <span className={styles.role}>{job.role}</span>
            {job.current && <span className={styles.currentBadge}>CURRENT</span>}
          </div>
          <div className={styles.meta}>
            <span className={styles.company}>{job.company}</span>
            <span className={styles.dot}>·</span>
            <span className={styles.type}>{job.type}</span>
          </div>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.period}>{job.period}</span>
          <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}>▾</span>
        </div>
      </button>
      {isOpen && (
        <div className={styles.body}>
          <ul className={styles.bullets}>
            {job.bullets.map((b, i) => (
              <li key={i} className={styles.bullet}>{b}</li>
            ))}
          </ul>
          <div className={styles.stack}>
            {job.stack.map((s, i) => (
              <span key={i} className={styles.tag}>{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
