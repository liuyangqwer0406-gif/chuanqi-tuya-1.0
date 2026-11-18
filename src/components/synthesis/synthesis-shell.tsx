"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { SYNTHESIS_ROUTE_READY } from "./route-events";
import { RouteCurtain } from "./route-curtain";
import { PlantParticleHero } from "./plant-particle-hero";
import { TransitionLink } from "./transition-link";
import { InstrumentCursor } from "./instrument-cursor";
import { FilmFooter } from "./film-footer";
import { ReadingProgress } from "./reading-progress";

gsap.registerPlugin(useGSAP);

const LOADER_PHASES = [
  { id: "01", primary: "INITIALIZING", secondary: "SCENE", cn: "初始化场景", status: "CREATING RENDER CONTEXT" },
  { id: "02", primary: "RESOLVING", secondary: "MATERIALS", cn: "解析材质与图像", status: "RESOLVING MATERIALS / IMAGES" },
  { id: "03", primary: "BINDING", secondary: "INPUT", cn: "绑定交互输入", status: "BINDING POINTER / TOUCH INPUT" },
  { id: "04", primary: "VIEW", secondary: "READY", cn: "视图准备完成", status: "3D SCENE / PORTFOLIO INDEX" },
] as const;

export function SynthesisShell({ children }: { children: React.ReactNode }) {
  const pathname = (usePathname() || "/").replace(/\/+$/, "") || "/";
  const normalizedPath = (pathname || "/").replace(/^\/(legendary-doodle1\.0|chuanqi-tuya-1\.0)/, "");
  const isHome = normalizedPath === "" || normalizedPath === "/" || normalizedPath === "/synthesis" || normalizedPath === "/synthesis/";
  const isAbout = normalizedPath === "/synthesis/about" || normalizedPath === "/synthesis/about/" || normalizedPath === "/about";
  const isLabRoute = normalizedPath.includes("/loader-lab") || normalizedPath.includes("/format-lab");
  const isProject = normalizedPath.startsWith("/synthesis/projects/");
  const hasPortfolioFooter = isHome || isAbout || isProject;
  const [loaded, setLoaded] = useState(isLabRoute);
  const [loaderPhase, setLoaderPhase] = useState(0);
  const loaderNode = useRef<HTMLDivElement>(null);
  const loaderIntroTimeline = useRef<gsap.core.Timeline | null>(null);
  const loaderExitTimeline = useRef<gsap.core.Timeline | null>(null);
  const loaderStartedAt = useRef(0);
  const primaryNav = useRef<HTMLElement>(null);
  const header = useRef<HTMLElement>(null);

  useEffect(() => {
    const bar = header.current;
    const paper = document.querySelector("[data-footer-paper]");
    if (!bar || !paper) return;

    let observer: IntersectionObserver;
    const observe = () => {
      observer?.disconnect();
      // Check the top edge of the viewport, after the footer's particle seam passes it.
      observer = new IntersectionObserver(([entry]) => {
        bar.dataset.surface = entry.isIntersecting ? "paper" : "dark";
      }, { rootMargin: `0px 0px -${Math.max(0, innerHeight - 1)}px 0px` });
      observer.observe(paper);
    };
    observe();
    window.addEventListener("resize", observe);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", observe);
      delete bar.dataset.surface;
    };
  }, [pathname]);

  useEffect(() => {
    const work = document.getElementById("work");
    const link = primaryNav.current?.querySelector('a[href="#work"]');
    if (!isHome || !work || !link) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }, { rootMargin: "-20% 0px -40% 0px" });
    observer.observe(work);
    return () => { observer.disconnect(); link.removeAttribute("aria-current"); };
  }, [isHome, pathname]);
  const visibleLoaderPhase = loaded ? LOADER_PHASES.length - 1 : loaderPhase;
  const loaderStage = LOADER_PHASES[visibleLoaderPhase];
  useGSAP(() => {
    const loader = loaderNode.current;
    if (!loader) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const verticalLine = loader.querySelector<HTMLElement>(".synthesis-loader__line--vertical");
    const horizontalLine = loader.querySelector<HTMLElement>(".synthesis-loader__line--horizontal");
    const meta = loader.querySelector<HTMLElement>(".synthesis-loader__meta");
    const axis = loader.querySelector<HTMLElement>(".synthesis-loader__axis");
    const status = loader.querySelector<HTMLElement>(".synthesis-loader__status");
    const footer = loader.querySelector<HTMLElement>(".synthesis-loader__footer");
    const scan = loader.querySelector<HTMLElement>(".synthesis-loader__rail i");
    const beacon = loader.querySelector<HTMLElement>(".synthesis-loader__meta i");
    const chrome = [meta, axis, status, footer].filter((item): item is HTMLElement => Boolean(item));

    loaderStartedAt.current = performance.now();
    gsap.set(loader, { autoAlpha: 1, clipPath: "inset(0 0 0% 0)" });

    if (reduced) {
      gsap.set(chrome, { autoAlpha: 1, y: 0 });
      if (verticalLine) gsap.set(verticalLine, { scaleY: 1 });
      if (horizontalLine) gsap.set(horizontalLine, { scaleX: 1 });
      return;
    }

    gsap.set(chrome, { autoAlpha: 0, y: 10 });
    if (verticalLine) gsap.set(verticalLine, { scaleY: 0, transformOrigin: "top center" });
    if (horizontalLine) gsap.set(horizontalLine, { scaleX: 0, transformOrigin: "left center" });
    if (scan) gsap.set(scan, { xPercent: -120 });

    loaderIntroTimeline.current = gsap.timeline({ defaults: { ease: "power3.out" } });
    if (verticalLine) loaderIntroTimeline.current.to(verticalLine, { scaleY: 1, duration: .72 }, 0);
    if (horizontalLine) loaderIntroTimeline.current.to(horizontalLine, { scaleX: 1, duration: .66 }, .06);
    if (meta) loaderIntroTimeline.current.to(meta, { autoAlpha: 1, y: 0, duration: .42 }, .1);
    loaderIntroTimeline.current
      .to([axis, status, footer].filter(Boolean), { autoAlpha: 1, y: 0, duration: .42, stagger: .045 }, .18)
      .call(() => setLoaderPhase(1), [], .48)
      .call(() => setLoaderPhase(2), [], .96);

    if (scan) gsap.to(scan, { xPercent: 520, duration: .9, ease: "none", repeat: -1 });
    if (beacon) gsap.to(beacon, { autoAlpha: .24, scale: .72, duration: .46, ease: "sine.inOut", repeat: -1, yoyo: true });

    return () => {
      loaderIntroTimeline.current?.kill();
      loaderIntroTimeline.current = null;
      gsap.killTweensOf([loader, ...loader.querySelectorAll("*")]);
    };
  }, { scope: loaderNode });

  useGSAP(() => {
    const loader = loaderNode.current;
    if (!loader) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const titleParts = Array.from(loader.querySelectorAll<HTMLElement>(".synthesis-loader__title b"));
    const titleNote = loader.querySelector<HTMLElement>(".synthesis-loader__title em");
    const statusValue = loader.querySelector<HTMLElement>(".synthesis-loader__status span:last-child");
    const progress = loader.querySelector<HTMLElement>(".synthesis-loader__rail b");
    const steps = Array.from(loader.querySelectorAll<HTMLElement>(".synthesis-loader__axis i"));
    const progressValue = (visibleLoaderPhase + 1) / LOADER_PHASES.length;

    if (reduced) {
      gsap.set(titleParts, { autoAlpha: 1, yPercent: 0 });
      if (titleNote) gsap.set(titleNote, { autoAlpha: 1, x: 0 });
      if (statusValue) gsap.set(statusValue, { autoAlpha: 1, x: 0 });
      if (progress) gsap.set(progress, { scaleX: progressValue });
      steps.forEach((step, index) => gsap.set(step, {
        scaleY: index <= visibleLoaderPhase ? 1 : .28,
        backgroundColor: index <= visibleLoaderPhase ? "var(--color-signal)" : "var(--color-line-dark)",
      }));
      return;
    }

    gsap.killTweensOf([...titleParts, titleNote, statusValue, progress, ...steps].filter(Boolean));
    const phaseTimeline = gsap.timeline({ defaults: { ease: "power3.out", overwrite: "auto" } });
    phaseTimeline.fromTo(titleParts,
      { autoAlpha: 0, yPercent: 112, rotate: .7 },
      { autoAlpha: 1, yPercent: 0, rotate: 0, duration: .5, stagger: .055 },
      0,
    );
    if (titleNote) phaseTimeline.fromTo(titleNote, { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, duration: .34 }, .16);
    if (statusValue) phaseTimeline.fromTo(statusValue, { autoAlpha: 0, x: 14 }, { autoAlpha: 1, x: 0, duration: .34 }, .12);
    if (progress) phaseTimeline.to(progress, { scaleX: progressValue, duration: .5, ease: "power2.inOut" }, 0);
    steps.forEach((step, index) => phaseTimeline.to(step, {
      scaleY: index <= visibleLoaderPhase ? 1 : .28,
      backgroundColor: index <= visibleLoaderPhase ? "var(--color-signal)" : "var(--color-line-dark)",
      duration: .38,
    }, index * .035));
  }, { scope: loaderNode, dependencies: [visibleLoaderPhase], revertOnUpdate: false });

  useGSAP(() => {
    if (!loaded) return;
    const loader = loaderNode.current;
    if (!loader) return;

    loaderIntroTimeline.current?.kill();
    loaderIntroTimeline.current = null;
    loaderExitTimeline.current?.kill();

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      gsap.set(loader, { autoAlpha: 0, visibility: "hidden" });
      return;
    }

    const titleParts = Array.from(loader.querySelectorAll<HTMLElement>(".synthesis-loader__title b"));
    const titleNote = loader.querySelector<HTMLElement>(".synthesis-loader__title em");
    const meta = loader.querySelector<HTMLElement>(".synthesis-loader__meta");
    const status = loader.querySelector<HTMLElement>(".synthesis-loader__status");
    const footer = loader.querySelector<HTMLElement>(".synthesis-loader__footer");
    const progress = loader.querySelector<HTMLElement>(".synthesis-loader__rail b");
    const scan = loader.querySelector<HTMLElement>(".synthesis-loader__rail i");
    const beacon = loader.querySelector<HTMLElement>(".synthesis-loader__meta i");
    const verticalLine = loader.querySelector<HTMLElement>(".synthesis-loader__line--vertical");
    const horizontalLine = loader.querySelector<HTMLElement>(".synthesis-loader__line--horizontal");
    const supportingCopy = [titleNote, meta, status, footer].filter((item): item is HTMLElement => Boolean(item));
    const elapsed = (performance.now() - loaderStartedAt.current) / 1000;
    const hold = Math.max(0, .68 - elapsed);

    gsap.killTweensOf([scan, beacon].filter(Boolean));
    loaderExitTimeline.current = gsap.timeline({ delay: hold, defaults: { overwrite: "auto" } });
    if (progress) loaderExitTimeline.current.to(progress, { scaleX: 1, duration: .22, ease: "power2.inOut" }, 0);
    loaderExitTimeline.current
      .to(titleParts, { autoAlpha: 0, yPercent: -118, duration: .32, stagger: .035, ease: "power3.in" }, .14)
      .to(supportingCopy, { autoAlpha: 0, y: -9, duration: .24, stagger: .025, ease: "power2.in" }, .16);
    if (verticalLine) loaderExitTimeline.current.to(verticalLine, { scaleY: 0, transformOrigin: "bottom center", duration: .34, ease: "power2.inOut" }, .22);
    if (horizontalLine) loaderExitTimeline.current.to(horizontalLine, { scaleX: 0, transformOrigin: "right center", duration: .34, ease: "power2.inOut" }, .22);
    loaderExitTimeline.current
      .to(loader, { clipPath: "inset(0 0 100% 0)", duration: .68, ease: "expo.inOut" }, .34)
      .set(loader, { autoAlpha: 0, visibility: "hidden" });

    return () => {
      loaderExitTimeline.current?.kill();
      loaderExitTimeline.current = null;
    };
  }, { scope: loaderNode, dependencies: [loaded], revertOnUpdate: false });

  useEffect(() => {
    const fallback = window.setTimeout(() => setLoaded(true), 1800);
    return () => window.clearTimeout(fallback);
  }, []);

  useEffect(() => {
    const ready = () => setLoaded(true);
    if (document.documentElement.dataset.routeReadyPath === pathname) ready();
    window.addEventListener(SYNTHESIS_ROUTE_READY, ready);
    return () => window.removeEventListener(SYNTHESIS_ROUTE_READY, ready);
  }, [pathname]);

  useEffect(() => {
    const nav = primaryNav.current;
    if (!nav) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const precise = window.matchMedia("(hover: hover) and (pointer: fine)");
    const items = Array.from(nav.querySelectorAll<HTMLElement>("[data-proximity-item]")).map((element) => ({
      element,
      label: element.querySelector<HTMLElement>("[data-proximity-label]"),
      center: 0,
      width: 0,
      value: 0,
      velocity: 0,
      target: 0,
    }));
    let frame = 0;

    const canAnimate = () => precise.matches && !reduced.matches && window.innerWidth > 800;
    const clearTransforms = () => {
      window.cancelAnimationFrame(frame);
      frame = 0;
      items.forEach((item) => {
        item.value = 0;
        item.velocity = 0;
        item.target = 0;
        if (item.label) item.label.style.transform = "";
      });
    };
    const measure = () => {
      clearTransforms();
      if (!canAnimate()) return;
      items.forEach((item) => {
        const rect = item.element.getBoundingClientRect();
        item.center = rect.left + rect.width * 0.5;
        item.width = rect.width;
      });
    };
    const draw = () => {
      frame = 0;
      if (!canAnimate()) {
        clearTransforms();
        return;
      }

      let moving = false;
      items.forEach((item) => {
        item.velocity += (item.target - item.value) * 0.19;
        item.velocity *= 0.7;
        item.value += item.velocity;
        if (Math.abs(item.target - item.value) < 0.001 && Math.abs(item.velocity) < 0.001) {
          item.value = item.target;
          item.velocity = 0;
        } else {
          moving = true;
        }

        const influence = Math.min(1.08, Math.max(0, item.value));
        const extraWidth = Math.min(6, item.width * 0.08);
        const scaleX = item.width > 0 ? (item.width + extraWidth * influence) / item.width : 1;
        if (item.label) {
          item.label.style.transform = `translateY(${(influence * 3.5).toFixed(2)}px) scaleX(${scaleX.toFixed(4)})`;
        }
      });

      if (moving) frame = window.requestAnimationFrame(draw);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(draw);
    };
    const reset = () => {
      items.forEach((item) => { item.target = 0; });
      schedule();
    };
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !canAnimate()) return;
      items.forEach((item) => {
        const proximity = Math.min(1, Math.max(0, 1 - Math.abs(event.clientX - item.center) / 122));
        item.target = proximity * proximity * (3 - 2 * proximity);
      });
      schedule();
    };

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(nav);
    nav.addEventListener("pointermove", onPointerMove);
    nav.addEventListener("pointerleave", reset);
    reduced.addEventListener("change", measure);
    precise.addEventListener("change", measure);
    measure();

    return () => {
      clearTransforms();
      resizeObserver.disconnect();
      nav.removeEventListener("pointermove", onPointerMove);
      nav.removeEventListener("pointerleave", reset);
      reduced.removeEventListener("change", measure);
      precise.removeEventListener("change", measure);
    };
  }, []);

  return (
    <div id="top" className={`synthesis-site${loaded ? " is-loaded" : " is-loading"}`} aria-busy={!loaded}>
      <InstrumentCursor />
      <a className="synthesis-skip" href="#content">Skip to content</a>
      {!isLabRoute && (
        <div ref={loaderNode} className="synthesis-loader" aria-hidden="true">
          <span className="synthesis-loader__line synthesis-loader__line--vertical" />
          <span className="synthesis-loader__line synthesis-loader__line--horizontal" />
          <div className="synthesis-loader__meta">
            <span><i />WEN YIFAN / 026</span>
            <span>VISUAL ARCHIVE / 2026</span>
          </div>
          <div className="synthesis-loader__field">
            <div className="synthesis-loader__title" key={loaderStage.id} aria-label={`${loaderStage.primary} ${loaderStage.secondary}`}>
              <span><b>{loaderStage.primary}</b></span>
              <span><b>{loaderStage.secondary}</b><em>{loaderStage.cn}</em></span>
            </div>
            <div className="synthesis-loader__axis">
              <span>{loaderStage.id}</span>
              <div aria-hidden="true">
                {LOADER_PHASES.map((phase, index) => <i key={phase.id} data-complete={index <= visibleLoaderPhase || undefined} />)}
              </div>
              <span>04</span>
            </div>
            <div className="synthesis-loader__status">
              <span>3D SCENE / PORTFOLIO INDEX</span>
              <span>{loaderStage.status}</span>
            </div>
          </div>
          <div className="synthesis-loader__footer">
            <div className="synthesis-loader__rail"><i /><b /></div>
            <div><span>LOADING / PHASE {loaderStage.id}</span><span>30.2741° N / 120.1551° E</span></div>
          </div>
        </div>
      )}
      <RouteCurtain />
      <div className={`synthesis-persistent-scene${isHome ? " is-active" : ""}`} aria-hidden="true">
        {isHome ? <PlantParticleHero /> : null}
      </div>
      {!isLabRoute && (
        <header ref={header} className="synthesis-header">
          <TransitionLink className="synthesis-brand" href="/synthesis" aria-label="Wen Yifan synthesis portfolio home"><b><span>WEN</span> YIFAN</b><small aria-hidden="true">026</small></TransitionLink>
          <nav ref={primaryNav} aria-label="Primary navigation">
            <TransitionLink data-proximity-item href={isHome ? "#work" : "/synthesis#work"} aria-current={isProject ? "true" : undefined}><span data-proximity-label>WORK</span></TransitionLink>
            <TransitionLink data-proximity-item href="/synthesis/about" aria-current={isAbout ? "page" : undefined}><span data-proximity-label>ABOUT</span></TransitionLink>
            <a data-proximity-item href="mailto:2742733283@qq.com"><span data-proximity-label>CONTACT</span></a>
          </nav>
        </header>
      )}
      {hasPortfolioFooter && <ReadingProgress />}
      {children}
      {hasPortfolioFooter && <FilmFooter isHome={isHome} />}
    </div>
  );
}
