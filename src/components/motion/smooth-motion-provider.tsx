"use client";

import { useEffect, useRef, useState, createContext, useContext, ReactNode } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import {
  TweaksPanel,
  MotionSettings,
  DEFAULT_MOTION_SETTINGS,
} from "./tweaks-panel";
import "./motion.css";
import { SYNTHESIS_NAVIGATION_START, SYNTHESIS_ROUTE_READY } from "@/components/synthesis/route-events";

const STORAGE_KEY = "wen_portfolio_motion_tweaks_v1";

interface SmoothMotionContextType {
  lenis: Lenis | null;
  settings: MotionSettings;
  scrollTo: (target: string | number | HTMLElement, options?: Record<string, unknown>) => void;
}

const SmoothMotionContext = createContext<SmoothMotionContextType>({
  lenis: null,
  settings: DEFAULT_MOTION_SETTINGS,
  scrollTo: () => {},
});

export const useSmoothScroll = () => useContext(SmoothMotionContext);

export function SmoothMotionProvider({ children }: { children?: ReactNode }) {
  const [settings, setSettings] = useState<MotionSettings>(DEFAULT_MOTION_SETTINGS);
  const [fps, setFps] = useState(60);
  const [velocity, setVelocity] = useState(0);
  const [scrollPercent, setScrollPercent] = useState(0);
  const lenisRef = useRef<Lenis | null>(null);

  // 1. Restore user preferences from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  // 2. Persist settings when modified
  const handleSettingsChange = (newSettings: MotionSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch {
      // ignore storage errors
    }
  };

  // 3. Initialize and configure Lenis smooth scroll engine
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isNative = settings.preset === "native" || reducedMotion;

    if (isNative) {
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
        document.documentElement.classList.remove("lenis", "lenis-smooth");
      }
      return;
    }

    const lenis = new Lenis({
      lerp: settings.lerp,
      duration: settings.duration,
      wheelMultiplier: settings.wheelMultiplier,
      touchMultiplier: 1.0,
      smoothWheel: true,
      syncTouch: false, // keep native 1:1 tactile touch feel on mobile
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Apple-class exponential decay
    });

    lenisRef.current = lenis;
    document.documentElement.classList.add("lenis", "lenis-smooth");

    // Connect Lenis to GSAP's central ticker for 60~144fps lockstep synchronization
    const tickerUpdate = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerUpdate);
    gsap.ticker.lagSmoothing(0);

    // Telemetry updates
    const onScroll = (e: { velocity: number; progress: number }) => {
      setVelocity(Math.abs(e.velocity));
      setScrollPercent((e.progress || 0) * 100);
    };
    lenis.on("scroll", onScroll);

    // Watch for modal lightboxes or route loading states
    const observer = new MutationObserver(() => {
      const isLightboxOpen = document.body.classList.contains("has-lightbox");
      const isSiteLoading = document.querySelector(".synthesis-site.is-loading") !== null;
      const isRouteBusy = Boolean(
        document.documentElement.dataset.routeState &&
        document.documentElement.dataset.routeState !== "idle"
      );

      if (isLightboxOpen || isSiteLoading || isRouteBusy) {
        lenis.stop();
      } else {
        lenis.start();
      }
    });

    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-route-state"] });

    // Handle smooth anchor navigation (NO scrollIntoView!)
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
            duration: settings.duration,
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
  }, [settings.lerp, settings.duration, settings.wheelMultiplier, settings.preset]);

  // 4. Handle route transition events (Pause during leaves, resume on ready)
  useEffect(() => {
    const onNavStart = () => {
      lenisRef.current?.stop();
    };
    const onRouteReady = () => {
      // Reset scroll position on new route
      window.scrollTo(0, 0);
      lenisRef.current?.scrollTo(0, { immediate: true });
      lenisRef.current?.start();
    };

    window.addEventListener(SYNTHESIS_NAVIGATION_START, onNavStart);
    window.addEventListener(SYNTHESIS_ROUTE_READY, onRouteReady);

    return () => {
      window.removeEventListener(SYNTHESIS_NAVIGATION_START, onNavStart);
      window.removeEventListener(SYNTHESIS_ROUTE_READY, onRouteReady);
    };
  }, []);

  // 5. FPS Telemetry counter
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId = 0;

    const measureFps = (now: number) => {
      frameCount++;
      if (now - lastTime >= 500) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(measureFps);
    };

    animId = requestAnimationFrame(measureFps);
    return () => cancelAnimationFrame(animId);
  }, []);

  // 6. Scroll Reveal Observer
  useEffect(() => {
    document.body.classList.toggle("motion-reveal-disabled", !settings.revealEnabled);
    if (!settings.revealEnabled) return;

    // Automatically decorate key design elements with data-reveal if not already tagged
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
  }, [settings.revealEnabled]);

  const scrollTo = (target: string | number | HTMLElement, options?: Record<string, unknown>) => {
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
  };

  return (
    <SmoothMotionContext.Provider value={{ lenis: lenisRef.current, settings, scrollTo }}>
      {children}
      <TweaksPanel
        settings={settings}
        onChange={handleSettingsChange}
        fps={fps}
        velocity={velocity}
        scrollPercent={scrollPercent}
      />
    </SmoothMotionContext.Provider>
  );
}
