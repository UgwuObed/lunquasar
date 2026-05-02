"use client";
import { useState } from "react";
import { projects } from "@/data/projects";
import styles from "./Portfolio.module.css";

export default function Portfolio() {
  return (
    <section id="work" className={styles.section}>
      <div className="container">
        <p className="section-label">01 / WORK</p>
        <h2 className="section-title">Things I've built</h2>
        <div className={styles.list}>
          {projects.map((p, i) => (
            <ProjectRow key={i} project={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProjectRow({ project, index }: { project: typeof projects[0]; index: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`${styles.row} ${hovered ? styles.rowHovered : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={styles.rowMain}>
        <div className={styles.rowHeader}>
          <span className={styles.idx}>{String(index + 1).padStart(2, "0")}</span>
          <span className={`${styles.name} ${hovered ? styles.nameHovered : ""}`}>
            {project.name}
          </span>
          <span className={`${styles.badge} ${project.status === "live" ? styles.live : styles.done}`}>
            {project.status === "live" ? "LIVE" : "DONE"}
          </span>
          <span className={styles.year}>{project.year}</span>
        </div>
        <p className={styles.desc}>{project.desc}</p>
        <div className={styles.stack}>
          {project.stack.map((s, j) => (
            <span key={j} className={styles.tag}>{s}</span>
          ))}
        </div>
      </div>
      <span className={`${styles.arrow} ${hovered ? styles.arrowHovered : ""}`}>→</span>
    </div>
  );
}
