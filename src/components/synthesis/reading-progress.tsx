"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSmoothScroll } from "@/components/motion/smooth-motion-provider";
import styles from "./reading-progress.module.css";

// Ring and percentage reference: 21st / reuno-ui / Circular Scroll Progress.
export function ReadingProgress() {
  const button = useRef<HTMLButtonElement>(null);
  const value = useRef<HTMLSpanElement>(null);
  const pathname = usePathname();
  const { scrollTo } = useSmoothScroll();

  useEffect(() => {
    const control = button.current;
    const number = value.current;
    if (!control || !number) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const distance = document.documentElement.scrollHeight - innerHeight;
      const progress = Math.max(0, Math.min(1, scrollY / Math.max(1, distance)));
      const percent = Math.round(progress * 100);
      const footer = document.getElementById("contact");
      const footerVisible = footer && footer.getBoundingClientRect().top < innerHeight - 80;
      const visible = scrollY > innerHeight * .6 && !footerVisible;
      control.style.setProperty("--read-progress", `${progress * 100}%`);
      control.dataset.visible = String(visible);
      control.setAttribute("aria-hidden", String(!visible));
      control.setAttribute("aria-label", `已浏览 ${percent}%，返回顶部`);
      control.tabIndex = visible ? 0 : -1;
      number.textContent = String(percent).padStart(2, "0");
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [pathname]);

  return (
    <button ref={button} className={styles.control} type="button" data-visible="false" tabIndex={-1} aria-hidden="true" aria-label="返回顶部"
      onClick={() => {
        const heading = document.querySelector<HTMLElement>("main h1");
        if (heading) {
          const previous = heading.getAttribute("tabindex");
          heading.setAttribute("tabindex", "-1");
          heading.focus({ preventScroll: true });
          heading.addEventListener("blur", () => {
            if (previous === null) heading.removeAttribute("tabindex");
            else heading.setAttribute("tabindex", previous);
          }, { once: true });
        }
        scrollTo(0, { duration: .85, immediate: matchMedia("(prefers-reduced-motion: reduce)").matches });
      }}>
      <span className={styles.hint} aria-hidden="true">返回顶部</span>
      <span className={styles.dial} aria-hidden="true">
        <i className={styles.ring} />
        <span className={styles.percentage}><span ref={value}>00</span><small>%</small></span>
        <span className={styles.arrow}>↑</span>
      </span>
    </button>
  );
}
