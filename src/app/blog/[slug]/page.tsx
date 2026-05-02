import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogNav from "@/components/BlogNav";
import { postMap, allPosts } from "@/data/blog-posts";
import styles from "./post.module.css";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  return allPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const post = postMap[slug];
  if (!post) return {};
  return {
    title: `${post.title} | Obed Ugwu`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = postMap[slug];
  if (!post) notFound();

  const { Content } = post;

  return (
    <>
      <BlogNav />
      <main className={styles.main}>
        <article className={styles.article}>
          <div className={styles.header}>
            <a href="/blog" className={styles.back}>← all posts</a>
            <div className={styles.headerMeta}>
              <span
                className={styles.tag}
                style={{ color: post.col, borderColor: `${post.col}33` }}
              >
                {post.tag}
              </span>
              <span className={styles.metaText}>{post.date} · {post.mins} read</span>
            </div>
            <h1 className={styles.title}>{post.title}</h1>
            <p className={styles.excerpt}>{post.excerpt}</p>
          </div>
          <div className={styles.divider} />
          <div className={styles.prose}>
            <Content />
          </div>
          <div className={styles.footer}>
            <div className={styles.divider} />
            <div className={styles.footerInner}>
              <a href="/blog" className={styles.footerBack}>← back to writing</a>
              <a href="/#hire" className={styles.footerCta}>work with me →</a>
            </div>
          </div>
        </article>
      </main>
    </>
  );
}
