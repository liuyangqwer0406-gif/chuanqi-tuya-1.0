"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { synthesisProjects } from "@/data/synthesis-projects";
import { LiquidLink } from "./liquid-link";
import { announceSynthesisRouteReady } from "./route-events";
import { createThreeUiDockController } from "./threeui-motion";
import { TransitionLink } from "./transition-link";
import { assetPath } from "@/lib/assets";
import { EvolutionStory } from "./evolution-story";

gsap.registerPlugin(useGSAP);

export function SynthesisHome() {
  const [active, setActive] = useState(0);
  const [outgoing, setOutgoing] = useState<number | null>(null);
  const [entering, setEntering] = useState(false);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [criticalCoverReady, setCriticalCoverReady] = useState(false);
  const routeReadyAnnounced = useRef(false);
  const homeRoot = useRef<HTMLElement>(null);
  const activeRef = useRef(0);
  const workStage = useRef<HTMLDivElement>(null);
  const workIndex = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef(0);
  const instantSelectionFrame = useRef(0);
  const selectionShouldAnimate = useRef(true);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const suppressCoverClick = useRef(false);
  const switchTimeline = useRef<gsap.core.Timeline | null>(null);
  const project = synthesisProjects[active];
  const outgoingProject = outgoing === null ? null : synthesisProjects[outgoing];

  useGSAP(() => {
    if (outgoing === null || !workStage.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const currentImage = workStage.current.querySelector<HTMLElement>(".synthesis-work__image-layer.is-current");
    const outgoingImage = workStage.current.querySelector<HTMLElement>(".synthesis-work__image-layer.is-outgoing");
    const currentCopy = workStage.current.querySelector<HTMLElement>(".synthesis-work__copy.is-current");
    const outgoingCopy = workStage.current.querySelector<HTMLElement>(".synthesis-work__copy.is-outgoing");
    if (!currentImage || !outgoingImage || !currentCopy || !outgoingCopy) return;

    switchTimeline.current?.kill();
    const sign = direction === "forward" ? 1 : -1;
    gsap.set(currentImage, {
      autoAlpha: 0,
      x: sign * 44,
      scale: 1.025,
      clipPath: "inset(0)",
    });
    gsap.set(outgoingImage, { autoAlpha: 1, x: 0, scale: 1, clipPath: "inset(0)" });
    gsap.set(currentCopy, { autoAlpha: 0, x: 0, y: 16 });
    gsap.set(outgoingCopy, { autoAlpha: 1, x: 0 });

    switchTimeline.current = gsap.timeline({
      defaults: { ease: "power3.out", overwrite: "auto" },
      onComplete: () => {
        switchTimeline.current = null;
        setEntering(false);
        setOutgoing(null);
      },
    });
    switchTimeline.current
      .to(outgoingImage, { autoAlpha: 0, x: -sign * 28, scale: 1, duration: .3 }, 0)
      .to(outgoingCopy, { autoAlpha: 0, y: -10, duration: .18 }, 0)
      .to(currentImage, { autoAlpha: 1, x: 0, scale: 1, duration: .48 }, .04)
      .to(currentCopy, { autoAlpha: 1, y: 0, duration: .36 }, .12);
  }, { scope: workStage, dependencies: [active, direction, outgoing], revertOnUpdate: false });

  useEffect(() => {
    const rail = workIndex.current;
    const item = rail?.querySelectorAll<HTMLButtonElement>("button")[active];
    if (!rail || !item || rail.scrollWidth <= rail.clientWidth) return;
    rail.scrollTo({
      left: item.offsetLeft - rail.offsetLeft - (rail.clientWidth - item.offsetWidth) / 2,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches || !selectionShouldAnimate.current ? "instant" : "smooth",
    });
  }, [active]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finish = () => { if (reduced.matches) switchTimeline.current?.progress(1); };
    reduced.addEventListener("change", finish);
    return () => reduced.removeEventListener("change", finish);
  }, []);

  const pathname = usePathname();

  useEffect(() => {
    if (!criticalCoverReady || routeReadyAnnounced.current) return;
    routeReadyAnnounced.current = true;
    announceSynthesisRouteReady(pathname || "/");
  }, [criticalCoverReady, pathname]);

  const selectProject = useCallback((index: number, animate = true) => {
    if (index === activeRef.current) return;

    switchTimeline.current?.kill();
    switchTimeline.current = null;

    const previous = activeRef.current;
    activeRef.current = index;
    const shouldAnimate = animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    selectionShouldAnimate.current = shouldAnimate;

    if (!shouldAnimate) {
      const rail = workIndex.current;
      rail?.setAttribute("data-instant", "true");
      window.cancelAnimationFrame(instantSelectionFrame.current);
      instantSelectionFrame.current = window.requestAnimationFrame(() => {
        instantSelectionFrame.current = window.requestAnimationFrame(() => rail?.removeAttribute("data-instant"));
      });
      setOutgoing(null);
      setEntering(false);
      setCriticalCoverReady(false);
      setActive(index);
      return;
    }

    setOutgoing(previous);
    setDirection(index > previous ? "forward" : "backward");
    setEntering(true);
    setActive(index);
  }, []);

  useEffect(() => {
    const returnSlug = window.sessionStorage.getItem("synthesis:return-project");
    if (!returnSlug) return undefined;
    window.sessionStorage.removeItem("synthesis:return-project");
    const returnIndex = synthesisProjects.findIndex((item) => item.slug === returnSlug);
    if (returnIndex < 0) return undefined;
    const frame = window.requestAnimationFrame(() => selectProject(returnIndex, false));
    return () => window.cancelAnimationFrame(frame);
  }, [selectProject]);

  useEffect(() => () => {
    switchTimeline.current?.kill();
    window.clearTimeout(hoverTimer.current);
    window.cancelAnimationFrame(instantSelectionFrame.current);
  }, []);

  useEffect(() => {
    const root = homeRoot.current;
    if (!root) return undefined;

    const sections = Array.from(root.querySelectorAll<HTMLElement>("[data-home-reveal]"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer: IntersectionObserver | null = null;

    const revealAll = () => sections.forEach((section) => { section.dataset.entered = "true"; });
    const observe = () => {
      observer?.disconnect();
      observer = null;
      if (reducedMotion.matches) {
        revealAll();
        return;
      }

      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          (entry.target as HTMLElement).dataset.entered = "true";
          observer?.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -12%" });

      sections.forEach((section) => {
        if (section.dataset.entered !== "true") observer?.observe(section);
      });
    };

    observe();
    reducedMotion.addEventListener("change", observe);
    return () => {
      observer?.disconnect();
      reducedMotion.removeEventListener("change", observe);
    };
  }, []);

  useEffect(() => {
    const index = workIndex.current;
    if (!index) return undefined;
    return createThreeUiDockController(index);
  }, []);

  return (
    <main ref={homeRoot} id="content" className="synthesis-main">
      <section id="synthesis-hero" className="synthesis-hero evolution-hero" aria-labelledby="synthesis-title">
        <div className="synthesis-hero__sticky">
          <div className="evolution-hero__coordinates" aria-hidden="true"><span>HANGZHOU / CHINA</span><span>FORM STUDY — 001</span></div>
          <div className="synthesis-hero__copy">
            <p>VISUAL DESIGN PORTFOLIO / 视觉设计作品集</p>
            <h1 id="synthesis-title"><span><b>VISUAL SYSTEMS</b></span><span><b>WITH A PULSE.</b></span></h1>
            <div className="synthesis-hero__foot">
              <p>Brand, packaging, spatial image and interactive work.<br />为真实内容建立清楚、可延展的视觉秩序。</p>
              <div className="evolution-hero__actions"><LiquidLink href="#work">VIEW SELECTED WORK</LiquidLink><TransitionLink href="#practice">EXPLORE THE PRACTICE <span>↓</span></TransitionLink></div>
            </div>
          </div>
        </div>
      </section>

      <section className="synthesis-work" id="work" aria-labelledby="synthesis-work-title">
        <header className="synthesis-section-head" data-home-reveal>
          <div className="synthesis-section-title" data-reveal-item>
            <span>ARCHIVE / 01 — 07 PROJECTS</span>
            <h2 id="synthesis-work-title">SELECTED WORK</h2>
          </div>
          <p data-reveal-item>精选 7 个设计项目，涵盖品牌、包装、三维与网页。从一套清楚的规则做起，在真实物料和屏幕上检验它好不好用。</p>
        </header>

        <div className="synthesis-work__transport">
          <p aria-live="polite" aria-atomic="true"><span>{String(active + 1).padStart(2, "0")}</span> / 07 <b>{project.title}</b></p>
          <div className="synthesis-work__steps" aria-label="Browse selected work">
            <span>EXPLORE THE INDEX</span>
            <button type="button" aria-label="Previous project" onClick={() => { window.clearTimeout(hoverTimer.current); selectProject((activeRef.current + synthesisProjects.length - 1) % synthesisProjects.length); }}>←</button>
            <button type="button" aria-label="Next project" onClick={() => { window.clearTimeout(hoverTimer.current); selectProject((activeRef.current + 1) % synthesisProjects.length); }}>→</button>
          </div>
        </div>

        <div ref={workStage} className="synthesis-work__stage">
          <div className={`synthesis-work__image${entering ? " is-entering" : ""} is-${direction}`}>
            <TransitionLink
              className="synthesis-work__cover-link"
              href={`/synthesis/projects/${project.slug}`}
              aria-label={`Open case study: ${project.title}`}
              data-transition-label={project.title}
              onPointerDown={(event) => {
                suppressCoverClick.current = false;
                if (event.pointerType === "mouse") return;
                swipe.current = { x: event.clientX, y: event.clientY };
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerUp={(event) => {
                const start = swipe.current;
                swipe.current = null;
                if (!start) return;
                const dx = event.clientX - start.x;
                const dy = event.clientY - start.y;
                suppressCoverClick.current = Math.hypot(dx, dy) > 12;
                if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                  selectProject((activeRef.current + (dx < 0 ? 1 : synthesisProjects.length - 1)) % synthesisProjects.length);
                }
              }}
              onPointerCancel={() => { swipe.current = null; suppressCoverClick.current = true; }}
              onClick={(event) => { if (event.detail > 0 && suppressCoverClick.current) { event.preventDefault(); suppressCoverClick.current = false; } }}
            />
            {outgoingProject && (
              <div className={`synthesis-work__image-layer is-outgoing${outgoingProject.cover.shape === "board" ? " is-board" : ""}`} key={outgoingProject.slug} aria-hidden="true">
                <Image src={outgoingProject.cover.src} alt="" fill sizes="(max-width: 800px) 100vw, 68vw" />
              </div>
            )}
            <div className={`synthesis-work__image-layer is-current${project.cover.shape === "board" ? " is-board" : ""}`} key={project.slug} data-transition-cover>
              <Image
                src={project.cover.src}
                alt={project.cover.alt}
                fill
                sizes="(max-width: 800px) 100vw, 68vw"
                priority={active === 0}
                onLoad={() => setCriticalCoverReady(true)}
                onError={() => setCriticalCoverReady(true)}
              />
            </div>
          </div>
          <div className="synthesis-work__card">
            <p>{project.discipline}<span>{project.year}</span></p>
            <div className={`synthesis-work__copy-stack${entering ? " is-entering" : ""} is-${direction}`}>
              {outgoingProject && (
                <div className="synthesis-work__copy is-outgoing" key={`${outgoingProject.slug}-copy`} aria-hidden="true">
                  <h3>{outgoingProject.title}</h3>
                  {outgoingProject.titleCn && <h4>{outgoingProject.titleCn}</h4>}
                  {outgoingProject.introCn && <p className="synthesis-work__intro-cn">{outgoingProject.introCn}</p>}
                  <p className="synthesis-work__intro-en">{outgoingProject.intro}</p>
                </div>
              )}
              <div className="synthesis-work__copy is-current" key={`${project.slug}-copy`}>
                <h3>{project.title}</h3>
                {project.titleCn && <h4>{project.titleCn}</h4>}
                {project.introCn && <p className="synthesis-work__intro-cn">{project.introCn}</p>}
                <p className="synthesis-work__intro-en">{project.intro}</p>
              </div>
            </div>
            <div className="synthesis-work__action">
              <p><span>OPEN CASE STUDY</span><b>PROJECT {String(active + 1).padStart(2, "0")}{" // 完整案例"}</b></p>
              <LiquidLink
                href={`/synthesis/projects/${project.slug}`}
                variant="orb"
                ariaLabel={`Open case study: ${project.title}`}
              >
                OPEN CASE STUDY
              </LiquidLink>
            </div>
          </div>
        </div>

        <div ref={workIndex} className="synthesis-work__index" aria-label="Choose a project">
          {synthesisProjects.map((item, index) => (
            <button
              type="button"
              key={item.slug}
              data-threeui-dock-item
              className={active === index ? "is-active" : ""}
              aria-pressed={active === index}
              onPointerEnter={(event) => {
                if (event.pointerType !== "mouse") return;
                window.clearTimeout(hoverTimer.current);
                hoverTimer.current = window.setTimeout(() => selectProject(index, true), 120);
              }}
              onPointerLeave={() => window.clearTimeout(hoverTimer.current)}
              onFocus={(event) => { if (event.currentTarget.matches(":focus-visible")) selectProject(index, false); }}
              onClick={() => { window.clearTimeout(hoverTimer.current); selectProject(index, true); }}
              onKeyDown={(event) => {
                const last = synthesisProjects.length - 1;
                const next = event.key === "ArrowRight" ? (index + 1) % synthesisProjects.length
                  : event.key === "ArrowLeft" ? (index + last) % synthesisProjects.length
                  : event.key === "Home" ? 0 : event.key === "End" ? last : null;
                if (next === null) return;
                event.preventDefault();
                workIndex.current?.querySelectorAll<HTMLButtonElement>("button")[next]?.focus({ preventScroll: true });
              }}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div className="synthesis-work__thumbnail" aria-hidden="true"><Image src={item.cover.src} alt="" fill sizes="160px" /></div>
              <b>{item.title}</b>
              <em>{item.titleCn ?? item.discipline}</em>
              <i aria-hidden="true">●</i>
            </button>
          ))}
        </div>
      </section>

      <EvolutionStory />

      <section className="synthesis-about" id="about" aria-labelledby="synthesis-about-title" data-home-reveal>
        <figure data-reveal-item data-reveal-media>
          <Image src={assetPath("portfolio-assets/about-portrait.webp")} alt="Portrait of designer Wen Yifan" fill sizes="(max-width: 800px) 100vw, 44vw" />
          <figcaption>WEN YIFAN / HANGZHOU</figcaption>
        </figure>
        <div className="synthesis-about__copy" data-reveal-item>
          <p>ABOUT / 关于</p>
          <h2 id="synthesis-about-title">MAKE COMPLEX IDEAS CLEAR ENOUGH TO TRAVEL.</h2>
          <h3>让复杂的想法，清楚到可以继续生长。</h3>
          <div className="synthesis-about__body">
            <p>I work across brand identity, packaging, 3D image and interactive presentation. The goal is not more visual noise, but a system that stays coherent from the first image to the final application.</p>
            <p>比起塞满花哨效果，我更在意一套视觉从第一张草图到最终送印上线，能不能始终讲得通、用得上。</p>
          </div>
          <dl>
            <div><dt>BASE</dt><dd>Hangzhou, China</dd></div>
            <div><dt>FOCUS</dt><dd>Brand / Visual / 3D</dd></div>
            <div><dt>METHOD</dt><dd>System first, image led</dd></div>
          </dl>
          <TransitionLink className="synthesis-about__link" href="/synthesis/about">FULL PROFILE / 查看完整介绍 <span>↗</span></TransitionLink>
        </div>
      </section>

      <section className="synthesis-contact" id="contact" aria-labelledby="synthesis-contact-title" data-home-reveal>
        <div data-reveal-item>
          <p>AVAILABLE FOR VISUAL DESIGN OPPORTUNITIES / 2026</p>
          <h2 id="synthesis-contact-title">LET&apos;S MAKE<br />THE IDEA VISIBLE.</h2>
          <h3>一起把想法做清楚。</h3>
        </div>
        <LiquidLink href="mailto:2742733283@qq.com" className="synthesis-contact__cta" data-reveal-item>START A CONVERSATION</LiquidLink>
        <footer data-reveal-item>
          <span>WEN YIFAN © 2026</span>
          <TransitionLink href="/synthesis">BACK TO TOP ↑</TransitionLink>
        </footer>
      </section>
    </main>
  );
}
