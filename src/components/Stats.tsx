"use client";
import { useState, useEffect, useRef } from "react";
import styles from "./Stats.module.css";

function useCountUp(target: number, duration: number, start: boolean) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    let t0: number | null = null;
    const frame = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      setVal(Math.floor(p * target));
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [target, duration, start]);
  return val;
}

export default function Stats() {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold: 0.4 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const years    = useCountUp(7,  1400, inView);
  const platforms = useCountUp(6,  1400, inView);
  const gateways = useCountUp(5,  1400, inView);
  const countries = useCountUp(15, 1600, inView);

  const data = [
    { v: years,    s: "+", l: "years in prod" },
    { v: platforms, s: "+", l: "platforms shipped" },
    { v: gateways, s: "",  l: "payment gateways" },
    { v: countries, s: "+", l: "countries reached" },
  ];

  return (
    <section ref={ref} className={styles.section}>
      <div className={styles.grid}>
        {data.map(({ v, s, l }, i) => (
          <div key={i} className={styles.stat}>
            <p className={styles.number}>{v}{s}</p>
            <p className={styles.label}>{l}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
