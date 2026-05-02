import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Obed Ugwu | Senior Backend Engineer",
  description:
    "Senior backend engineer with 7+ years shipping payment systems, music platforms, and crypto tools in production. Based in Lagos, Nigeria. Available for senior remote contracts and full-time roles.",
  keywords: [
    "backend engineer",
    "Node.js",
    "TypeScript",
    "Laravel",
    "AWS",
    "fintech",
    "Lagos",
    "Nigeria",
    "remote",
  ],
  authors: [{ name: "Obed Ugwu" }],
  openGraph: {
    title: "Obed Ugwu | Senior Backend Engineer",
    description:
      "7+ years shipping production systems across fintech, music distribution, and e-commerce.",
    url: "https://lunqausar",
    siteName: "lunqausar",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Obed Ugwu | Senior Backend Engineer",
    description:
      "7+ years shipping production systems across fintech, music distribution, and e-commerce.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
