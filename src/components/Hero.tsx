"use client";
import { useEffect, useState } from "react";
import styles from "./Hero.module.css";

export default function Hero() {
  const [on, setOn] = useState(false);
  useEffect(() => { setTimeout(() => setOn(true), 80); }, []);

  return (
    <section className={styles.section}>
      <div className={`${styles.content} ${on ? styles.visible : ""}`}>
        <p className={styles.eyebrow}>Lagos, Nigeria · WAT (UTC+1)</p>
        <h1 className={styles.headline}>
          Obed.<br />
          <span className={styles.muted}>Backend</span><br />
          <span className={styles.accent}>Engineer.</span>
        </h1>
        <p className={styles.sub}>
          7+ years building payment systems, music platforms, and crypto tools in
          production. Self-taught. Based in Lagos. Open to senior remote contracts
          and full-time roles.
        </p>
        <div className={styles.ctas}>
          <a href="#work" className={styles.ctaPrimary}>view work →</a>
          <a href="#hire" className={styles.ctaSecondary}>work with me</a>
        </div>
        <div className={styles.pills}>
          {["Node.js/TS", "Laravel/PHP", "AWS", "Paystack", "Polar.sh", "VFD"].map((t) => (
            <span key={t} className={styles.pill}>{t}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
