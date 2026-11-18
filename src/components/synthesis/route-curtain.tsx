"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { normalizeRoutePath, SYNTHESIS_NAVIGATION_START, SYNTHESIS_ROUTE_READY, type SynthesisNavigationDetail } from "./route-events";
import styles from "./route-curtain.module.css";

gsap.registerPlugin(useGSAP);
const ROUTE_CHECK = "synthesis:route-check";

// Staggered columns inspired by 21st / su2491251 / Page Transition (29262).
export function RouteCurtain() {
  const root = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  useEffect(() => { window.dispatchEvent(new Event(ROUTE_CHECK)); }, [pathname]);

  useGSAP((_, contextSafe) => {
    const overlay = root.current!;
    const strips = overlay.querySelectorAll(`.${styles.strip}`);
    const label = overlay.querySelector(`.${styles.label}`)!;
    const status = overlay.querySelector('[role="status"]')!;
    const html = document.documentElement;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let pending: SynthesisNavigationDetail | null = null;
    let phase = "idle";
    let timeline: gsap.core.Timeline | null = null;
    let watchdog = 0, bufferTimer = 0, readyFrame = 0;
    const setPhase = (value: string) => {
      phase = value;
      html.dataset.routeState = value;
      overlay.dataset.phase = value;
      overlay.setAttribute("aria-hidden", String(value === "idle"));
      html.classList.toggle("is-route-leaving", value === "leaving" || value === "loading");
      html.classList.toggle("is-route-loading", value === "loading");
      html.classList.toggle("is-route-entering", value === "entering");
    };
    const reset = () => {
      timeline?.kill();
      timeline = null;
      clearTimeout(watchdog);
      clearTimeout(bufferTimer);
      cancelAnimationFrame(readyFrame);
      pending = null;
      gsap.set(overlay, { autoAlpha: 0 });
      gsap.set(strips, { y: 0, yPercent: 100 });
      gsap.set(label, { opacity: 0, y: 12 });
      status.textContent = "";
      delete html.dataset.routeReduced;
      setPhase("idle");
    };
    const finish = () => {
      reset();
      const focusTarget = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : document.querySelector<HTMLElement>("main h1");
      if (focusTarget) {
        const previous = focusTarget.getAttribute("tabindex");
        focusTarget.setAttribute("tabindex", "-1");
        focusTarget.focus({ preventScroll: true });
        focusTarget.addEventListener("blur", () => {
          if (previous === null) focusTarget.removeAttribute("tabindex");
          else focusTarget.setAttribute("tabindex", previous);
        }, { once: true });
      }
    };
    const reveal = contextSafe!(() => {
      if (!pending || phase !== "loading") return;
      if (normalizeRoutePath(location.pathname) !== pending.pathname || html.dataset.routeReadyPath !== pending.pathname) return;
      clearTimeout(watchdog);
      clearTimeout(bufferTimer);
      if (pending.reducedMotion || motion.matches) { finish(); return; }
      setPhase("entering");
      timeline = gsap.timeline({ onComplete: finish });
      timeline.to(label, { opacity: 0, y: -12, duration: .18, ease: "power2.out" }, 0)
        .to(strips, { yPercent: -100, duration: .34, stagger: .025, ease: "power3.inOut" }, 0);
    });
    const check = () => {
      cancelAnimationFrame(readyFrame);
      readyFrame = requestAnimationFrame(reveal);
    };
    const covered = () => {
      if (!pending) return;
      setPhase("loading");
      pending.navigate();
      check();
    };
    const start = contextSafe!((event: Event) => {
      if (pending) return;
      pending = (event as CustomEvent<SynthesisNavigationDetail>).detail;
      label.textContent = pending.label;
      const reduced = pending.reducedMotion || motion.matches;
      html.dataset.routeReduced = String(reduced);
      setPhase("leaving");
      watchdog = window.setTimeout(finish, 8000);
      bufferTimer = window.setTimeout(() => { if (pending) status.textContent = "正在准备页面…"; }, 1200);
      if (reduced) { covered(); return; }
      gsap.set(overlay, { autoAlpha: 1 });
      gsap.set(strips, { y: 0, yPercent: 100 });
      gsap.set(label, { opacity: 0, y: 12 });
      timeline = gsap.timeline({ onComplete: covered });
      timeline.to(strips, { yPercent: 0, duration: .24, stagger: .025, ease: "power3.inOut" }, 0)
        .to(label, { opacity: 1, y: 0, duration: .16, ease: "power2.out" }, .18);
    });
    const reducedChanged = contextSafe!(() => {
      if (!pending || !motion.matches) return;
      pending.reducedMotion = true;
      timeline?.kill();
      html.dataset.routeReduced = "true";
      gsap.set(overlay, { autoAlpha: 0 });
      if (phase === "leaving") covered();
      else if (phase === "entering") finish();
      else check();
    });
    const cancel = contextSafe!(reset);
    const keyboard = (event: KeyboardEvent) => {
      if (phase !== "idle" && event.key === "Tab") event.preventDefault();
      if (phase === "leaving" && event.key === "Escape") cancel();
    };
    reset();
    window.addEventListener(SYNTHESIS_NAVIGATION_START, start);
    window.addEventListener(SYNTHESIS_ROUTE_READY, check);
    window.addEventListener(ROUTE_CHECK, check);
    window.addEventListener("popstate", cancel);
    window.addEventListener("keydown", keyboard);
    motion.addEventListener("change", reducedChanged);
    return () => {
      window.removeEventListener(SYNTHESIS_NAVIGATION_START, start);
      window.removeEventListener(SYNTHESIS_ROUTE_READY, check);
      window.removeEventListener(ROUTE_CHECK, check);
      window.removeEventListener("popstate", cancel);
      window.removeEventListener("keydown", keyboard);
      motion.removeEventListener("change", reducedChanged);
      reset();
    };
  }, { scope: root });

  return <div ref={root} className={styles.curtain} data-phase="idle" aria-hidden="true">
    <div className={styles.columns} aria-hidden="true">{[0,1,2,3,4].map(index => <i className={styles.strip} key={index} />)}</div>
    <div className={styles.copy}><span>WEN YIFAN / SELECTED WORK</span><p className={styles.label} /><span role="status" aria-live="polite" /></div>
  </div>;
}
