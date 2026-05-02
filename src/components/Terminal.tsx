"use client";
import { useState, useEffect, useRef } from "react";
import { terminalCommands } from "@/data/content";
import styles from "./Terminal.module.css";

interface HistLine { t: "sys" | "in" | "out" | "err"; v: string; }

interface TerminalProps { onClose: () => void; }

export default function Terminal({ onClose }: TerminalProps) {
  const [hist, setHist] = useState<HistLine[]>([
    { t: "sys", v: "lunqausar terminal v1.0.0" },
    { t: "sys", v: 'type "help" for available commands · ctrl+` to toggle' },
  ]);
  const [inp, setInp] = useState("");
  const btm = useRef<HTMLDivElement>(null);
  const inpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inpRef.current?.focus();
    btm.current?.scrollIntoView({ behavior: "smooth" });
  }, [hist]);

  const run = (cmd: string) => {
    const c = cmd.trim().toLowerCase();
    const next: HistLine[] = [...hist, { t: "in", v: `❯ ${cmd}` }];
    if (c === "clear") {
      setHist([{ t: "sys", v: 'cleared. type "help" for commands.' }]);
      setInp("");
      return;
    }
    if (c === "exit") { onClose(); return; }
    if (c === "") { setHist(next); setInp(""); return; }
    const res = terminalCommands[c];
    setHist([...next, res ? { t: "out", v: res } : { t: "err", v: `command not found: ${c}. try "help"` }]);
    setInp("");
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.window}>
        <div className={styles.titleBar}>
          <div className={styles.dots}>
            <button className={`${styles.dot} ${styles.red}`} onClick={onClose} />
            <div className={`${styles.dot} ${styles.yellow}`} />
            <div className={`${styles.dot} ${styles.greenDot}`} />
          </div>
          <span className={styles.title}>obed@dev / bash</span>
          <span style={{ width: 44 }} />
        </div>
        <div className={styles.body}>
          {hist.map((l, i) => (
            <pre
              key={i}
              className={`${styles.line} ${styles[l.t]}`}
            >
              {l.v}
            </pre>
          ))}
          <div ref={btm} />
        </div>
        <div className={styles.inputRow}>
          <span className={styles.prompt}>❯</span>
          <input
            ref={inpRef}
            value={inp}
            onChange={(e) => setInp(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run(inp)}
            className={styles.input}
            placeholder="type a command..."
            spellCheck={false}
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  );
}
