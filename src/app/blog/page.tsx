import type { Metadata } from "next";
import BlogNav from "@/components/BlogNav";
import { allPosts } from "@/data/blog-posts";
import styles from "./blog.module.css";

export const metadata: Metadata = {
  title: "Writing | Obed Ugwu",
  description:
    "Technical writing on backend engineering, fintech, crypto infrastructure, and systems design from me.",
};

export default function BlogPage() {
  return (
    <>
      <BlogNav />
      <main className={styles.main}>
        <div className={styles.container}>
          <p className="section-label">WRITING</p>
          <h1 className={styles.title}>Things I&apos;ve written</h1>
          <p className={styles.subtitle}>
            Notes on backend systems, Nigerian fintech, crypto infrastructure, and the occasional
            career reflection. No filler.
          </p>
          <div className={styles.list}>
            {allPosts.map((post) => (
              <a key={post.slug} href={`/blog/${post.slug}`} className={styles.card}>
                <div className={styles.cardTop}>
                  <span
                    className={styles.tag}
                    style={{ color: post.col, borderColor: `${post.col}33` }}
                  >
                    {post.tag}
                  </span>
                  <span className={styles.meta}>
                    {post.date} · {post.mins} read
                  </span>
                </div>
                <h2 className={styles.cardTitle}>{post.title}</h2>
                <p className={styles.excerpt}>{post.excerpt}</p>
                <span className={styles.readMore}>Read post →</span>
              </a>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
