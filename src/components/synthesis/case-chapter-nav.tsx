"use client";

import { useEffect, useRef } from "react";

export function CaseChapterNav({ chapters }: { chapters: { id: string; title: string }[] }) {
  const nav = useRef<HTMLElement>(null);

  useEffect(() => {
    const links = Array.from(nav.current?.querySelectorAll<HTMLAnchorElement>("a") ?? []);
    const sections = chapters.map(({ id }) => document.getElementById(id));
    let frame = 0;
    let current = -1;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * .35;
      let active = 0;
      sections.forEach((section, index) => {
        if (section && section.getBoundingClientRect().top <= line) active = index;
      });
      if (active === current) return;
      current = active;
      links.forEach((link, index) => {
        if (index === active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [chapters]);

  return (
    <nav ref={nav} className="case-chapter-nav" aria-label="Case study chapters">
      <span>IN THIS PROJECT</span>
      <div>
        {chapters.map((chapter, index) => (
          <a key={chapter.id} href={`#${chapter.id}`}>
            <span>{String(index + 1).padStart(2, "0")}</span>{chapter.title}
          </a>
        ))}
      </div>
    </nav>
  );
}
