"use client";

import { useEffect, useRef, useState } from "react";
import { SylvaLivingWorldScene } from "./sylva-living-world-scene";

export function PlantParticleHero() {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);
  useEffect(() => {
    const host = root.current;
    const hero = document.getElementById("synthesis-hero");
    if (!host || !hero) return;
    let frame = 0;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      frame = 0;
      const rect = hero.getBoundingClientRect();
      const progress = reduced.matches ? 0 : Math.max(0, Math.min(1, -rect.top / Math.max(1, hero.offsetHeight - innerHeight)));
      hero.style.setProperty("--hero-travel", String(progress));
      host.querySelector("iframe")?.contentWindow?.postMessage({ type: "synthesis:fusion", progress }, "*");
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { rootMargin: "-90px 0px 0px" });
    observer.observe(hero);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    host.addEventListener("load", schedule, true);
    reduced.addEventListener("change", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame); observer.disconnect();
      window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule);
      host.removeEventListener("load", schedule, true); reduced.removeEventListener("change", schedule);
      hero.style.removeProperty("--hero-travel");
    };
  }, []);
  return <div ref={root} className="plant-particle-hero"><SylvaLivingWorldScene variant="black-ember" plantParticles active={active} /></div>;
}
