"use client";

import { useEffect, useRef } from "react";

type Point = readonly [number, number, number];
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

// The same particles form a sphere, a packaging volume, and three screen frames.
function shape(index: number, form: number): Point {
  const u = index / 1500;
  const angle = index * 2.39996323;
  if (form === 0) {
    const y = 1 - u * 2;
    const radius = Math.sqrt(1 - y * y);
    return [Math.cos(angle) * radius, y, Math.sin(angle) * radius];
  }
  if (form === 1) {
    const y = u * 2.1 - 1.05;
    const radius = y < -.66 ? .23 : y < -.35 ? .23 + (y + .66) * .95 : .525;
    return [Math.cos(angle) * radius, y, Math.sin(angle) * radius];
  }
  const layer = index % 3;
  const edge = Math.floor(index / 3) % 4;
  const t = (Math.floor(index / 12) % 125) / 124;
  const x = edge === 0 ? mix(-.9, .9, t) : edge === 1 ? .9 : edge === 2 ? mix(.9, -.9, t) : -.9;
  const y = edge === 0 ? -.62 : edge === 1 ? mix(-.62, .62, t) : edge === 2 ? .62 : mix(.62, -.62, t);
  return [x + layer * .08, y + layer * .06, (layer - 1) * .42];
}

export function ParticleField({ variant }: { variant: "hero" | "practice" }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = document.getElementById(variant === "hero" ? "synthesis-hero" : "practice");
    const surface = canvas?.parentElement;
    if (!canvas || !section || !surface) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = matchMedia("(pointer: coarse)");
    const forms = [0, 1, 2].map(form => Array.from({ length: 1500 }, (_, i) => shape(i, form)));
    let frame = 0;
    let visible = false;
    let width = 0;
    let height = 0;
    let pointerX = 0;
    let pointerY = 0;
    let lastProgress = 0;

    const draw = () => {
      frame = 0;
      if (!visible || document.hidden || !width || !height) return;
      const rect = section.getBoundingClientRect();
      const travel = Math.max(1, section.offsetHeight - innerHeight);
      const progress = reduced.matches ? 0 : clamp((72 - rect.top) / travel);
      lastProgress = progress;
      const morph = variant === "hero" ? progress * .8
        : progress < .46 ? clamp((progress - .22) / .18) : 1 + clamp((progress - .55) / .18);
      const from = Math.min(1, Math.floor(morph));
      const to = from + 1;
      const raw = morph - from;
      const t = raw * raw * (3 - 2 * raw);
      const rotateY = variant === "hero" ? -.22 + progress * 1.5 + pointerX * .18 : -.3 + progress * .8 + pointerX * .15;
      const rotateX = -.12 + pointerY * .12;
      const cosY = Math.cos(rotateY), sinY = Math.sin(rotateY);
      const cosX = Math.cos(rotateX), sinX = Math.sin(rotateX);
      const scale = Math.min(width, height) * (variant === "hero" ? .365 : .34);
      ctx.clearRect(0, 0, width, height);
      const points = [];
      for (let i = 0; i < 1500; i += coarse.matches ? 2 : 1) {
        const a = forms[from][i], b = forms[to][i];
        const x = mix(a[0], b[0], t), y = mix(a[1], b[1], t), z = mix(a[2], b[2], t);
        const rx = x * cosY + z * sinY;
        const rz = z * cosY - x * sinY;
        const ry = y * cosX - rz * sinX;
        const depth = y * sinX + rz * cosX;
        const perspective = 3.7 / (3.7 - depth);
        points.push({ x: width / 2 + rx * scale * perspective, y: height / 2 + ry * scale * perspective, depth, i });
      }
      points.sort((a, b) => a.depth - b.depth);
      for (const point of points) {
        const alpha = .18 + clamp((point.depth + 1.3) / 2.6) * .72;
        ctx.fillStyle = point.i % 17 === 0 ? `rgba(255,81,37,${alpha})`
          : variant === "hero" ? `rgba(244,243,239,${alpha})` : `rgba(30,29,27,${alpha})`;
        ctx.beginPath();
        ctx.arc(point.x, point.y, .7 + clamp((point.depth + 1) / 2) * .8, 0, Math.PI * 2);
        ctx.fill();
      }
      canvas.dataset.rendered = "true";
      canvas.dataset.progress = lastProgress.toFixed(3);
      canvas.dataset.draws = String(Number(canvas.dataset.draws || 0) + 1);
      if (variant === "hero") section.style.setProperty("--hero-travel", progress.toFixed(4));
    };
    const wake = () => { if (!frame && visible && !document.hidden) frame = requestAnimationFrame(draw); };
    const resize = () => {
      const rect = surface.getBoundingClientRect();
      width = rect.width; height = rect.height;
      const dpr = Math.min(devicePixelRatio, 1.75);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      wake();
    };
    const move = (event: PointerEvent) => {
      if (reduced.matches || event.pointerType !== "mouse") return;
      const rect = surface.getBoundingClientRect();
      pointerX = Math.max(-1, Math.min(1, (event.clientX - rect.left) / width * 2 - 1));
      pointerY = Math.max(-1, Math.min(1, (event.clientY - rect.top) / height * 2 - 1));
      wake();
    };
    const reset = () => { pointerX = 0; pointerY = 0; wake(); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) resize(); }, { rootMargin: "80px" });
    observer.observe(variant === "hero" ? section : surface);
    const resizer = new ResizeObserver(resize);
    resizer.observe(surface);
    window.addEventListener("scroll", wake, { passive: true });
    surface.addEventListener("pointermove", move, { passive: true });
    surface.addEventListener("pointerleave", reset);
    document.addEventListener("visibilitychange", wake);
    reduced.addEventListener("change", reset);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect(); resizer.disconnect();
      window.removeEventListener("scroll", wake);
      surface.removeEventListener("pointermove", move);
      surface.removeEventListener("pointerleave", reset);
      document.removeEventListener("visibilitychange", wake);
      reduced.removeEventListener("change", reset);
      section.style.removeProperty("--hero-travel");
    };
  }, [variant]);

  return <canvas ref={canvasRef} className={`evolution-particles evolution-particles--${variant}`} aria-hidden="true" />;
}
