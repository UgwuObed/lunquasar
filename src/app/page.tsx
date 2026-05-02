"use client";
import { useState, useEffect } from "react";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Stats from "@/components/Stats";
import Portfolio from "@/components/Portfolio";
import Experience from "@/components/Experience";
import Blog from "@/components/Blog";
import Now from "@/components/Now";
import WorkWithMe from "@/components/WorkWithMe";
import Footer from "@/components/Footer";
import Terminal from "@/components/Terminal";

export default function Home() {
  const [termOpen, setTermOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "`" && e.ctrlKey) {
        e.preventDefault();
        setTermOpen((v) => !v);
      }
      if (e.key === "Escape" && termOpen) {
        setTermOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [termOpen]);

  return (
    <>
      <Nav onTerminal={() => setTermOpen(true)} />
      <main>
        <Hero />
        <Stats />
        <Portfolio />
        <Experience />
        <Blog />
        <Now />
        <WorkWithMe />
      </main>
      <Footer onTerminal={() => setTermOpen(true)} />
      {termOpen && <Terminal onClose={() => setTermOpen(false)} />}
    </>
  );
}
