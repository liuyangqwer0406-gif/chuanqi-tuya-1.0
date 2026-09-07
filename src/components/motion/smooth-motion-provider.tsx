"use client";

import { useEffect, useRef, createContext, useContext, ReactNode, useCallback } from "react";
import Lenis from "lenis";
import gsap from "gsap";
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

  // 1. Initialize and configure Lenis smooth scroll engine
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
        document.documentElement.classList.remove("lenis", "lenis-smooth");
      }
      return;
    }

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
    document.documentElement.classList.add("lenis", "lenis-smooth");

    // Connect Lenis to GSAP central ticker for 60~144fps lockstep sync
    const tickerUpdate = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerUpdate);

    // Only pause when an actual modal lightbox is open, NEVER during normal browsing or page transitions
    const observer = new MutationObserver(() => {
      const isLightboxOpen = document.body.classList.contains("has-lightbox");
      if (isLightboxOpen) {
        lenis.stop();
      } else {
        lenis.start();
      }
    });

    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    // Handle smooth anchor navigation (without scrollIntoView)
    const onAnchorClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (href && href.startsWith("#") && href.length > 1) {
        const elem = document.querySelector(href);
        if (elem instanceof HTMLElement) {
          event.preventDefault();
          lenis.scrollTo(elem, {
            offset: -88,
            duration: 1.0,
          });
        }
      }
    };

    document.addEventListener("click", onAnchorClick);

    return () => {
      document.removeEventListener("click", onAnchorClick);
      observer.disconnect();
      gsap.ticker.remove(tickerUpdate);
      lenis.destroy();
      lenisRef.current = null;
      document.documentElement.classList.remove("lenis", "lenis-smooth");
    };
  }, []);

  // 2. Scroll Reveal Observer (viewport fade-in entrance)
  useEffect(() => {
    const autoTargets = document.querySelectorAll(
      ".synthesis-chapter, .case-figure, .work-stage, .proof-grid, .hybrid-section-head, .hybrid-about__copy, .synthesis-project-hero__content"
    );
    autoTargets.forEach((el) => {
      if (!el.hasAttribute("data-reveal")) {
        el.setAttribute("data-reveal", "true");
      }
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: "0px 0px -40px 0px",
        threshold: 0.08,
      }
    );

    const revealItems = document.querySelectorAll("[data-reveal]");
    revealItems.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const scrollTo = useCallback((target: string | number | HTMLElement, options?: Record<string, unknown>) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, options);
    } else if (typeof target === "number") {
      window.scrollTo({ top: target, behavior: "smooth" });
    } else if (typeof target === "string") {
      const el = document.querySelector(target);
      if (el instanceof HTMLElement) {
        const top = el.getBoundingClientRect().top + window.scrollY - 88;
        window.scrollTo({ top, behavior: "smooth" });
      }
    } else if (target instanceof HTMLElement) {
      const top = target.getBoundingClientRect().top + window.scrollY - 88;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }, []);

  return (
    <SmoothMotionContext.Provider value={{ lenis: lenisRef.current, scrollTo }}>
      {children}
    </SmoothMotionContext.Provider>
  );
}
