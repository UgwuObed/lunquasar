"use client";
import { useState, useEffect } from "react";
import styles from "./BlogNav.module.css";

export default function BlogNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ""}`}>
      <a href="/" className={styles.logo}>lunqausar</a>
      <div className={styles.links}>
        <a href="/#work" className={styles.link}>work</a>
        <a href="/#experience" className={styles.link}>experience</a>
        <a href="/blog" className={styles.linkActive}>blog</a>
        <a href="/#hire" className={styles.link}>hire</a>
      </div>
    </nav>
  );
}
