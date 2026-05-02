"use client";
import { useState } from "react";
import { posts } from "@/data/content";
import styles from "./Blog.module.css";

export default function Blog() {
  return (
    <section id="blog" className={styles.section}>
      <div className="container container--border">
        <p className="section-label">03 / WRITING</p>
        <div className={styles.titleRow}>
          <h2 className="section-title" style={{ marginBottom: 0 }}>Things I've written</h2>
          <a href="/blog" className={styles.allLink}>all posts →</a>
        </div>
        <div className={styles.list}>
          {posts.map((post, i) => (
            <BlogCard key={i} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}

function BlogCard({ post }: { post: typeof posts[0] }) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={`/blog/${post.slug}`}
      className={`${styles.card} ${hovered ? styles.cardHovered : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={styles.cardMain}>
        <div className={styles.meta}>
          <span className={styles.tag} style={{ color: post.col, borderColor: `${post.col}33` }}>
            {post.tag}
          </span>
          <span className={styles.date}>{post.date} · {post.mins} read</span>
        </div>
        <h3 className={`${styles.title} ${hovered ? styles.titleHovered : ""}`}>{post.title}</h3>
      </div>
      <span className={`${styles.arrow} ${hovered ? styles.arrowHovered : ""}`}>→</span>
    </a>
  );
}
