"use client";
import { useState, useEffect } from "react";
import styles from "./Nav.module.css";

interface NavProps {
  onTerminal: () => void;
}

export default function Nav({ onTerminal }: NavProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ""}`}>
      <a href="#" className={styles.logo}>lunqausar</a>
      <div className={styles.links}>
        {[["work", "#work"], ["experience", "#experience"], ["blog", "#blog"], ["now", "#now"], ["hire", "#hire"]].map(
          ([label, href]) => (
            <a key={label} href={href} className={styles.link}>
              {label}
            </a>
          )
        )}
        <button onClick={onTerminal} className={styles.termBtn}>
          ~/terminal
        </button>
      </div>
    </nav>
  );
}
