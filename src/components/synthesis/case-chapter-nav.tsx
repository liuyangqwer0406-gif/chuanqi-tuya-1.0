"use client";

import { useEffect, useRef } from "react";
import styles from "./interaction-controls.module.css";

export function CaseChapterNav({ chapters }: { chapters: { id: string; title: string }[] }) {
  const nav = useRef<HTMLElement>(null);
  const indicator = useRef<HTMLElement>(null);

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
      const changed = active !== current;
      current = active;
      links.forEach((link, index) => {
        if (index === active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
      const link = links[active];
      const track = link?.parentElement;
      if (link && track && indicator.current) {
        indicator.current.style.transform = `translateX(${link.offsetLeft + 16}px) scaleX(${Math.max(0, link.offsetWidth - 32)})`;
        if (changed && (link.offsetLeft < track.scrollLeft || link.offsetLeft + link.offsetWidth > track.scrollLeft + track.clientWidth)) {
          track.scrollTo({ left: Math.max(0, link.offsetLeft - (track.clientWidth - link.offsetWidth) / 2), behavior: "instant" });
        }
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    const observer = new ResizeObserver(schedule);
    links.forEach(link => observer.observe(link));
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
    };
  }, [chapters]);

  return (
    <nav ref={nav} className="case-chapter-nav" aria-label="Case study chapters">
      <span>IN THIS PROJECT</span>
      <div className={styles.chapterTrack}>
        {/* Sliding underline reference: 21st.dev / educalvolpz / Animated Tabs. */}
        <i ref={indicator} className={styles.indicator} aria-hidden="true" />
        {chapters.map((chapter, index) => (
          <a key={chapter.id} href={`#${chapter.id}`} onKeyDown={event => {
            const links = Array.from(nav.current?.querySelectorAll<HTMLAnchorElement>("a") ?? []);
            let target = index;
            if (event.key === "ArrowRight") target = (index + 1) % links.length;
            else if (event.key === "ArrowLeft") target = (index - 1 + links.length) % links.length;
            else if (event.key === "Home") target = 0;
            else if (event.key === "End") target = links.length - 1;
            else return;
            event.preventDefault();
            links[target]?.focus();
          }}>
            <span>{String(index + 1).padStart(2, "0")}</span>{chapter.title}
          </a>
        ))}
      </div>
    </nav>
  );
}
