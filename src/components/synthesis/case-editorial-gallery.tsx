"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useSmoothScroll } from "@/components/motion/smooth-motion-provider";
import styles from "./case-editorial-gallery.module.css";

// Layout and expanded-image reference: 21st / uilayout.contact / Gallery Modal Accordion.
export function CaseEditorialGallery({ children, count }: { children: ReactNode; count: number }) {
  const [view, setView] = useState("story");
  const [switching, setSwitching] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const previous = useRef<DOMRect[]>([]);
  const selectedButton = useRef<HTMLButtonElement | null>(null);
  const { scrollTo } = useSmoothScroll();

  useLayoutEffect(() => {
    if (!previous.current.length || !root.current) return;
    let cancelled = false;
    const figures = Array.from(root.current.querySelectorAll<HTMLElement>(".case-figure"));
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animations = figures.map((figure, index) => {
      const before = previous.current[index];
      const after = figure.getBoundingClientRect();
      return figure.animate([
        { transformOrigin: "top left", transform: `translate(${before.x - after.x}px, ${before.y - after.y}px) scale(${before.width / after.width}, ${before.height / after.height})` },
        { transformOrigin: "top left", transform: "none" },
      ], { duration: reduced ? 0 : 520, easing: "cubic-bezier(.22,1,.36,1)" });
    });
    previous.current = [];
    void Promise.allSettled(animations.map(animation => animation.finished)).then(() => {
      if (!cancelled) setSwitching(false);
    });
    return () => {
      cancelled = true;
      animations.forEach(animation => animation.cancel());
    };
  }, [view]);

  useLayoutEffect(() => {
    if (!switching && document.activeElement === document.body) selectedButton.current?.focus({ preventScroll: true });
  }, [switching]);

  const changeView = (next: string, button: HTMLButtonElement) => {
    if (next === view || switching || !root.current) return;
    selectedButton.current = button;
    scrollTo(root.current.getBoundingClientRect().top + scrollY - 128, { immediate: true });
    // Complete the existing one-shot reveals before changing the geometry.
    root.current.querySelectorAll<HTMLElement>("[data-case-reveal]").forEach(element => { element.dataset.entered = "true"; });
    previous.current = Array.from(root.current.querySelectorAll(".case-figure"), figure => figure.getBoundingClientRect());
    setSwitching(true);
    setView(next);
  };

  return (
    <div ref={root} className={styles.editorial} data-view={view}>
      <div className={styles.toolbar}>
        <p>SELECTED IMAGES <span>{count} 张作品</span></p>
        <div className={styles.switch} role="group" aria-label="作品浏览方式">
          <i aria-hidden="true" />
          <button type="button" aria-pressed={view === "story"} disabled={switching} onClick={event => changeView("story", event.currentTarget)}>叙事浏览</button>
          <button type="button" aria-pressed={view === "overview"} disabled={switching} onClick={event => changeView("overview", event.currentTarget)}>图片总览</button>
        </div>
        <span className="sr-only" role="status">{view === "story" ? "叙事浏览" : "图片总览"}，共 {count} 张作品</span>
      </div>
      {children}
    </div>
  );
}
