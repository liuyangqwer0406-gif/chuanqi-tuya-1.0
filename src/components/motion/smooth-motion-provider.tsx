"use client";

import { useEffect, useRef, useState, createContext, useContext, ReactNode, useCallback } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import "./motion.css";

interface SmoothMotionContextType {
  lenis: Lenis | null;
  scrollTo: (target: string | number | HTMLElement, options?: Record<string, unknown>) => void;
}

const SmoothMotionContext = createContext<SmoothMotionContextType>({
  lenis: null,
  scrollTo: () => {},
});

export const useSmoothScroll = () => useContext(SmoothMotionContext);

export function SmoothMotionProvider({ children }: { children?: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const [scrollEngine, setScrollEngine] = useState<Lenis | null>(null);
  const wakeRef = useRef<() => void>(() => {});
  const pathname = usePathname();

  // 1. Initialize and configure Lenis smooth scroll engine
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const precisePointer = window.matchMedia("(pointer: fine)");
    let dispose = () => {};
    const configure = () => {
      dispose();
      if (reducedMotion.matches || !precisePointer.matches) return;

      // High performance, responsive and silky momentum damping
      const lenis = new Lenis({
        lerp: 0.1, // Silky yet responsive inertia buffer; never sluggish or stuck
        wheelMultiplier: 1.0,
        touchMultiplier: 1.0,
        smoothWheel: true,
        syncTouch: false, // 100% native frictionless touch on mobile/trackpads
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Apple-class exponential decay
      });

      lenisRef.current = lenis;
      setScrollEngine(lenis);
      document.documentElement.classList.add("lenis", "lenis-smooth");

      // Wake for input and stop requesting frames once scroll inertia has settled.
      let frame = 0;
      let drawing = false;
      const draw = (time: number) => {
        frame = 0;
        if (document.hidden || lenis.isStopped) return;
        drawing = true;
        lenis.raf(time);
        drawing = false;
        if (lenis.isScrolling === "smooth") frame = requestAnimationFrame(draw);
      };
      const wake = () => {
        if (frame || drawing || document.hidden || lenis.isStopped) return;
        // Reset the time origin before a new wheel/anchor animation starts.
        drawing = true;
        lenis.raf(performance.now());
        drawing = false;
        frame = requestAnimationFrame(draw);
      };
      wakeRef.current = wake;
      lenis.on("virtual-scroll", wake);
      const syncVisibility = () => {
        if (document.hidden) {
          cancelAnimationFrame(frame);
          frame = 0;
          lenis.stop();
        } else if (!document.body.classList.contains("has-lightbox")) lenis.start();
      };
      document.addEventListener("visibilitychange", syncVisibility);

      // Only pause when an actual modal lightbox is open, NEVER during normal browsing or page transitions
      const observer = new MutationObserver(() => {
        const isLightboxOpen = document.body.classList.contains("has-lightbox");
        if (isLightboxOpen) {
          cancelAnimationFrame(frame);
          frame = 0;
          lenis.stop();
        } else if (!document.hidden) {
          lenis.start();
        }
      });

      observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });

      // Handle smooth anchor navigation (without scrollIntoView)
      const onAnchorClick = (event: MouseEvent) => {
        if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        const target = event.target as HTMLElement | null;
        const anchor = target?.closest("a");
        if (!anchor) return;

        const href = anchor.getAttribute("href");
        if (href && href.startsWith("#") && href.length > 1) {
          const elem = document.getElementById(decodeURIComponent(href.slice(1)));
          if (elem instanceof HTMLElement) {
            event.preventDefault();
            wake();
            window.history.pushState(window.history.state, "", href);
            const top = elem.getBoundingClientRect().top + window.scrollY - Math.max(88, parseFloat(getComputedStyle(elem).scrollMarginTop) || 0);
            lenis.scrollTo(top, {
              duration: .8,
            });
          }
        }
      };

      document.addEventListener("click", onAnchorClick);

      dispose = () => {
        document.removeEventListener("click", onAnchorClick);
        observer.disconnect();
        cancelAnimationFrame(frame);
        wakeRef.current = () => {};
        document.removeEventListener("visibilitychange", syncVisibility);
        lenis.destroy();
        lenisRef.current = null;
        setScrollEngine(null);
        document.documentElement.classList.remove("lenis", "lenis-smooth");
      };
    };
    configure();
    reducedMotion.addEventListener("change", configure);
    precisePointer.addEventListener("change", configure);
    return () => {
      dispose();
      reducedMotion.removeEventListener("change", configure);
      precisePointer.removeEventListener("change", configure);
    };
  }, []);

  // 2. Scroll Reveal Observer (viewport fade-in entrance)
  useEffect(() => {
    const autoTargets = document.querySelectorAll<HTMLElement>(
      "#content .synthesis-section-head, #content .synthesis-capabilities__grid article, #content .synthesis-about__copy, #content .synthesis-contact > div, #content .case-figure, #content .case-chapter > header, #content .case-motion > header, #content .case-closing"
    );
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;
    autoTargets.forEach((el) => { el.dataset.motionReveal = "pending"; });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-motion-reveal", "visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: "0px 0px -40px 0px",
        threshold: 0.01,
      }
    );

    autoTargets.forEach((el) => observer.observe(el));
    const showAll = () => {
      if (!reduced.matches) return;
      observer.disconnect();
      autoTargets.forEach(el => { el.dataset.motionReveal = "visible"; });
    };
    reduced.addEventListener("change", showAll);

    return () => {
      observer.disconnect();
      reduced.removeEventListener("change", showAll);
      autoTargets.forEach(el => { delete el.dataset.motionReveal; });
    };
  }, [pathname]);

  const scrollTo = useCallback((target: string | number | HTMLElement, options?: Record<string, unknown>) => {
    const immediate = options?.immediate === true || options?.duration === 0;
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches || immediate ? "instant" : "smooth";
    if (lenisRef.current) {
      wakeRef.current();
      lenisRef.current.scrollTo(target, options);
    } else if (typeof target === "number") {
      window.scrollTo({ top: target, behavior });
    } else if (typeof target === "string") {
      const el = document.querySelector(target);
      if (el instanceof HTMLElement) {
        const top = el.getBoundingClientRect().top + window.scrollY - 88;
        window.scrollTo({ top, behavior });
      }
    } else if (target instanceof HTMLElement) {
      const top = target.getBoundingClientRect().top + window.scrollY - 88;
      window.scrollTo({ top, behavior });
    }
  }, []);

  return (
    <SmoothMotionContext.Provider value={{ lenis: scrollEngine, scrollTo }}>
      {children}
    </SmoothMotionContext.Provider>
  );
}
