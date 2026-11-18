"use client";

import Image from "next/image";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { ProjectImage, ProjectMotionPoster, ProjectMotionSection, SynthesisProject } from "@/data/synthesis-projects";
import { synthesisProjects } from "@/data/synthesis-projects";
import { LiquidLink } from "./liquid-link";
import { announceSynthesisRouteReady } from "./route-events";
import { TransitionLink } from "./transition-link";
import { CaseChapterNav } from "./case-chapter-nav";
import { GalleryThumbnailStrip } from "./gallery-thumbnail-strip";
import { CaseImageViewport } from "./case-image-viewport";
import { CaseEditorialGallery } from "./case-editorial-gallery";
import { animateImageFlight, containedImageBounds } from "./case-image-flight";
import interactionStyles from "./interaction-controls.module.css";

function RevealedCaseTitle({ text }: { text: string }) {
  const root = useRef<HTMLHeadingElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const heading = root.current;
    if (!heading) return;

    let frame = 0;
    let started = false;
    let loadObserver: MutationObserver | null = null;
    let routeObserver: MutationObserver | null = null;

    const start = () => {
      if (started) return;
      started = true;
      frame = window.requestAnimationFrame(() => setVisible(true));
    };

    const waitForRoute = () => {
      const routeState = document.documentElement.dataset.routeState;
      if (!routeState || routeState === "idle") {
        frame = window.requestAnimationFrame(start);
        return;
      }
      routeObserver = new MutationObserver(() => {
        if (document.documentElement.dataset.routeState !== "idle") return;
        routeObserver?.disconnect();
        routeObserver = null;
        frame = window.requestAnimationFrame(start);
      });
      routeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-route-state"] });
    };

    const site = heading.closest(".synthesis-site");
    if (!site || site.classList.contains("is-loaded")) {
      waitForRoute();
    } else {
      loadObserver = new MutationObserver(() => {
        if (!site.classList.contains("is-loaded")) return;
        loadObserver?.disconnect();
        loadObserver = null;
        waitForRoute();
      });
      loadObserver.observe(site, { attributes: true, attributeFilter: ["class"] });
    }

    return () => {
      window.cancelAnimationFrame(frame);
      loadObserver?.disconnect();
      routeObserver?.disconnect();
    };
  }, [text]);

  return (
    <h1 ref={root} id="case-title">
      <span className={`case-title-reveal${visible ? " is-visible" : ""}`}>{text}</span>
    </h1>
  );
}

function ProjectFigure({ item, lead = false, onOpen }: { item: ProjectImage; lead?: boolean; onOpen: (item: ProjectImage, trigger: HTMLButtonElement) => void }) {
  const shapeClass = item.shape ? ` case-figure--${item.shape}` : "";
  const leadClass = lead ? " is-lead" : "";
  return (
    <figure className={`case-figure${shapeClass}${leadClass}`} data-case-reveal>
      <button type="button" onClick={(event) => onOpen(item, event.currentTarget)} aria-label={`Enlarge image: ${item.caption}`} data-image-src={item.src} data-case-reveal-item data-case-reveal-media>
        <span className="case-figure__media">
          <Image src={item.src} alt={item.alt} fill sizes="(max-width: 800px) 100vw, 50vw" />
        </span>
        <span className="case-figure__open" aria-hidden="true">VIEW ↗</span>
      </button>
      <figcaption data-case-reveal-item><b>{item.caption}</b><span>{item.note}</span></figcaption>
    </figure>
  );
}

function MotionPoster({ item }: { item: ProjectMotionPoster }) {
  const root = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [inView, setInView] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [manualPaused, setManualPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const node = root.current;
    if (!node || !("IntersectionObserver" in window)) {
      const frame = window.requestAnimationFrame(() => {
        setInView(true);
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) setShouldLoad(true);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
      if (entry.isIntersecting && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) setShouldLoad(true);
    }, { rootMargin: "18% 0px", threshold: 0.05 });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const syncPlayback = useCallback(() => {
    const media = video.current;
    if (!media || !shouldLoad || unavailable) return;

    if (inView && !document.hidden && !manualPaused && !reducedMotion) {
      void media.play().catch(() => setPlaying(false));
    } else {
      media.pause();
    }
  }, [inView, manualPaused, reducedMotion, shouldLoad, unavailable]);

  useEffect(() => {
    if (shouldLoad) video.current?.load();
  }, [shouldLoad]);

  useEffect(() => {
    syncPlayback();
    document.addEventListener("visibilitychange", syncPlayback);
    return () => document.removeEventListener("visibilitychange", syncPlayback);
  }, [syncPlayback]);

  const togglePlayback = () => {
    const media = video.current;
    if (!media || unavailable) return;
    setShouldLoad(true);

    if (!media.paused) {
      setManualPaused(true);
      media.pause();
      return;
    }

    setManualPaused(false);
    void media.play().catch(() => setPlaying(false));
  };

  return (
    <figure ref={root} className={`motion-poster motion-poster--${item.placement}`} data-case-reveal>
      <button
        type="button"
        onClick={togglePlayback}
        aria-label={`${playing ? "Pause" : "Play"} motion poster: ${item.caption}`}
        aria-pressed={playing}
        disabled={unavailable}
        data-case-reveal-item
        data-case-reveal-media
      >
        <span className="motion-poster__media">
          <video
            ref={video}
            poster={item.poster}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
            onCanPlay={syncPlayback}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onError={() => setUnavailable(true)}
          >
            {shouldLoad && <source src={item.src} type="video/mp4" />}
          </video>
        </span>
        <span className="motion-poster__control" aria-hidden="true">
          {unavailable ? "STILL" : playing ? "PAUSE" : "PLAY"}
        </span>
      </button>
      <figcaption data-case-reveal-item><b>{item.caption}</b><span>{item.note}</span></figcaption>
    </figure>
  );
}

function MotionSection({ section }: { section: ProjectMotionSection }) {
  const lead = section.posters.find((item) => item.placement === "lead");
  const portrait = section.posters.find((item) => item.placement === "portrait");
  const stack = section.posters.filter((item) => item.placement === "stack");

  return (
    <section className="case-motion" id="case-motion" aria-labelledby="case-motion-title">
      <header data-case-reveal>
        <div data-case-reveal-item>
          <p>MOTION / 10 SEC LOOPS</p>
          <h2 id="case-motion-title">{section.title}</h2>
          <h3>{section.titleCn}</h3>
        </div>
        <p data-case-reveal-item>{section.body}</p>
      </header>
      <div className="case-motion__gallery">
        {lead && <MotionPoster item={lead} />}
        <div className="case-motion__split">
          {portrait && <MotionPoster item={portrait} />}
          <div className="case-motion__stack">
            {stack.map((item) => <MotionPoster item={item} key={item.src} />)}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProjectDetail({ project }: { project: SynthesisProject }) {
  const isEditorial = project.slug === "packaging-design";
  const [lightbox, setLightbox] = useState<ProjectImage | null>(null);
  const [lightboxClosing, setLightboxClosing] = useState(false);
  const [lightboxOpening, setLightboxOpening] = useState(false);
  const lightboxClose = useRef<HTMLButtonElement>(null);
  const lightboxTrigger = useRef<HTMLButtonElement | null>(null);
  const lightboxCloseTimer = useRef<number | null>(null);
  const lightboxOpenFrame = useRef(0);
  const lightboxDialog = useRef<HTMLDivElement>(null);
  const caseRoot = useRef<HTMLElement>(null);
  const flightOrigin = useRef<DOMRect | null>(null);
  const flightCleanup = useRef<(() => void) | null>(null);
  const gallery = useMemo(() => project.chapters.flatMap(chapter => chapter.images), [project]);
  const chapterLinks = useMemo(() => project.chapters.flatMap((chapter, index) => {
    const item = { id: `${project.slug}-section-${index}`, title: chapter.title };
    return index === 0 && project.motion ? [item, { id: "case-motion", title: "MOTION STUDIES" }] : [item];
  }), [project]);
  const lightboxIndex = lightbox ? gallery.findIndex(item => item.src === lightbox.src) : -1;
  const readySlug = useRef<string | null>(null);
  const currentIndex = synthesisProjects.findIndex((item) => item.slug === project.slug);
  const previous = synthesisProjects[(currentIndex - 1 + synthesisProjects.length) % synthesisProjects.length];
  const next = synthesisProjects[(currentIndex + 1) % synthesisProjects.length];
  const projectNumber = String(currentIndex + 1).padStart(2, "0");
  const projectTotal = String(synthesisProjects.length).padStart(2, "0");
  const hasLightbox = Boolean(lightbox);
  const stepLightbox = useCallback((direction: number) => {
    flightCleanup.current?.();
    flightOrigin.current = null;
    setLightbox(current => {
      if (!current || !gallery.length) return current;
      const index = gallery.findIndex(item => item.src === current.src);
      return gallery[(index + direction + gallery.length) % gallery.length];
    });
  }, [gallery]);
  const markRouteReady = useCallback((degraded = false) => {
    if (readySlug.current === project.slug) return;
    readySlug.current = project.slug;
    announceSynthesisRouteReady(`/synthesis/projects/${project.slug}`, degraded);
  }, [project.slug]);

  const closeLightbox = useCallback((immediate = false) => {
    if (!lightbox || lightboxClosing) return;
    if (lightboxCloseTimer.current !== null) window.clearTimeout(lightboxCloseTimer.current);
    flightCleanup.current?.();
    flightOrigin.current = null;

    if (immediate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLightboxOpening(false);
      setLightboxClosing(false);
      setLightbox(null);
      return;
    }

    let closeDuration = 220;
    const currentImage = lightboxDialog.current?.querySelector<HTMLImageElement>(".case-lightbox__media img");
    const target = Array.from(caseRoot.current?.querySelectorAll<HTMLButtonElement>("[data-image-src]") ?? [])
      .find(button => button.dataset.imageSrc === lightbox.src)?.querySelector("img");
    if (isEditorial && currentImage && target?.complete && target.naturalWidth && !currentImage.closest('[data-zoomed="true"]')) {
      const destination = containedImageBounds(target);
      if (destination.top >= 200 && destination.bottom <= innerHeight) {
        flightCleanup.current = animateImageFlight(currentImage, containedImageBounds(currentImage), destination);
        closeDuration = 440;
      }
    }
    setLightboxClosing(true);
    lightboxCloseTimer.current = window.setTimeout(() => {
      setLightbox(null);
      setLightboxClosing(false);
      lightboxCloseTimer.current = null;
    }, closeDuration);
  }, [isEditorial, lightbox, lightboxClosing]);

  const closeLightboxRef = useRef(closeLightbox);
  useEffect(() => {
    closeLightboxRef.current = closeLightbox;
  }, [closeLightbox]);

  useEffect(() => {
    if (lightbox && document.activeElement === document.body) lightboxClose.current?.focus({ preventScroll: true });
  }, [lightbox]);

  useEffect(() => {
    if (!hasLightbox) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key === "Escape") closeLightboxRef.current(true);
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        stepLightbox(event.key === "ArrowRight" ? 1 : -1);
      }
      if (event.key === "Tab") {
        const controls = Array.from(lightboxDialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled):not([tabindex="-1"]), a[href]') ?? []);
        const first = controls[0];
        const last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.body.classList.add("has-lightbox");
    const site = document.querySelector<HTMLElement>(".synthesis-site");
    const wasInert = site?.inert ?? false;
    if (site) site.inert = true;
    window.addEventListener("keydown", onKey);
    const focusFrame = requestAnimationFrame(() => lightboxClose.current?.focus());
    return () => {
      cancelAnimationFrame(focusFrame);
      cancelAnimationFrame(lightboxOpenFrame.current);
      document.body.classList.remove("has-lightbox");
      if (site) site.inert = wasInert;
      window.removeEventListener("keydown", onKey);
      flightCleanup.current?.();
      lightboxTrigger.current?.focus({ preventScroll: true });
    };
  }, [hasLightbox, stepLightbox]);

  useEffect(() => () => {
    flightCleanup.current?.();
    if (lightboxCloseTimer.current !== null) window.clearTimeout(lightboxCloseTimer.current);
    window.cancelAnimationFrame(lightboxOpenFrame.current);
  }, []);

  useEffect(() => {
    const root = caseRoot.current;
    if (!root) return undefined;

    const groups = Array.from(root.querySelectorAll<HTMLElement>("[data-case-reveal]"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer: IntersectionObserver | null = null;

    const revealAll = () => groups.forEach((group) => { group.dataset.entered = "true"; });
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
      }, { threshold: 0.08, rootMargin: "10% 0px -10%" });

      groups.forEach((group) => {
        if (group.dataset.entered !== "true") observer?.observe(group);
      });
    };

    observe();
    reducedMotion.addEventListener("change", observe);
    return () => {
      observer?.disconnect();
      reducedMotion.removeEventListener("change", observe);
    };
  }, [project.slug]);

  const openLightbox = (item: ProjectImage, trigger: HTMLButtonElement) => {
    if (lightboxCloseTimer.current !== null) window.clearTimeout(lightboxCloseTimer.current);
    lightboxTrigger.current = trigger;
    const source = trigger.querySelector("img");
    flightOrigin.current = isEditorial && source?.complete && source.naturalWidth ? containedImageBounds(source) : null;
    setLightboxClosing(false);
    setLightboxOpening(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setLightbox(item);
    lightboxOpenFrame.current = window.requestAnimationFrame(() => setLightboxOpening(false));
  };

  const chapters = project.chapters.map((chapter, chapterIndex) => (
    <Fragment key={chapter.title}>
      <section id={`${project.slug}-section-${chapterIndex}`} className="case-chapter" aria-labelledby={`${project.slug}-chapter-${chapterIndex}`}>
        <header data-case-reveal>
          <div data-case-reveal-item>
            <p className="case-chapter__index">CHAPTER {String(chapterIndex + 1).padStart(2, "0")} / {String(project.chapters.length).padStart(2, "0")} · {String(chapter.images.length).padStart(2, "0")} IMAGES</p>
            <h2 id={`${project.slug}-chapter-${chapterIndex}`}>{chapter.title}</h2>
            <h3>{chapter.titleCn}</h3>
          </div>
          <p data-case-reveal-item>{chapter.body}</p>
        </header>
        <div className="case-gallery">
          {chapter.images.map((item, imageIndex) => <ProjectFigure item={item} lead={imageIndex === 0 && !item.shape} onOpen={openLightbox} key={item.src} />)}
        </div>
      </section>
      {chapterIndex === 0 && project.motion && <MotionSection section={project.motion} />}
    </Fragment>
  ));

  return (
    <main ref={caseRoot} id="content" className={`case-page${isEditorial ? " case-page--editorial" : ""}`}>
      <section className="case-hero" aria-labelledby="case-title">
        <div className="case-hero__heading">
          <div className="case-hero__meta">
            <p>{project.discipline}</p>
            <p><span>PROJECT {projectNumber} / {projectTotal}</span><span>{project.year} · {project.status}</span></p>
          </div>
          <RevealedCaseTitle text={project.title} />
          {project.titleCn && <h2>{project.titleCn}</h2>}
        </div>
        <figure className={`case-hero__media${project.cover.shape === "board" ? " case-hero__media--board" : ""}`} data-transition-cover>
          <Image
            src={project.cover.src}
            alt={project.cover.alt}
            fill
            priority
            sizes="100vw"
            onLoad={() => markRouteReady(false)}
            onError={() => markRouteReady(true)}
          />
          <figcaption><span>{project.cover.caption}</span><span>{project.cover.note}</span></figcaption>
        </figure>
      </section>

      <section className="case-intro" aria-label="Project overview" data-case-reveal>
        <div className="case-intro__lead" data-case-reveal-item>
          <p className="case-intro__eyebrow">PROJECT OVERVIEW / 项目概览</p>
          <p className="case-intro__statement">{project.intro}</p>
          <p className="case-intro__statement-cn">{project.introCn}</p>
        </div>
        <dl data-case-reveal-item>
          <div><dt>ROLE</dt><dd>{project.role}</dd></div>
          <div><dt>SCOPE</dt><dd>{project.scope}</dd></div>
          <div><dt>STATUS</dt><dd>{project.status}</dd></div>
          <div><dt>YEAR</dt><dd>{project.year}</dd></div>
        </dl>
      </section>

      <CaseChapterNav chapters={chapterLinks} />

      {isEditorial ? <CaseEditorialGallery count={gallery.length}>{chapters}</CaseEditorialGallery> : chapters}

      <section className="case-closing" aria-labelledby="case-closing-title" data-case-reveal>
        <div data-case-reveal-item>
          <p>PROJECT {projectNumber} / RESULT &amp; BOUNDARY</p>
          <h2 id="case-closing-title">WHAT IS DONE.<br />WHAT REMAINS TRUE.</h2>
        </div>
        <div data-case-reveal-item>
          <p>{project.closing}</p>
          <p>{project.closingCn}</p>
        </div>
        <LiquidLink href="mailto:2742733283@qq.com" alwaysOn data-case-reveal-item>DISCUSS THIS WORK</LiquidLink>
      </section>

      <nav className="case-navigation" aria-label="Project navigation" data-case-reveal>
        <TransitionLink href={`/synthesis/projects/${previous.slug}`} data-transition-label={`${previous.title} / PREVIOUS PROJECT`} data-case-reveal-item>
          <span className="case-navigation__preview" aria-hidden="true"><Image src={previous.cover.src} alt="" fill sizes="34vw" /></span>
          <span className="case-navigation__label">← PREVIOUS</span><b>{previous.title}</b>
        </TransitionLink>
        <TransitionLink className="case-navigation__all" href="/synthesis#work" data-transition-label="PROJECT INDEX / ALL WORK" data-case-reveal-item><span className="case-navigation__label">ALL WORK</span><b>PROJECT INDEX</b></TransitionLink>
        <TransitionLink href={`/synthesis/projects/${next.slug}`} data-transition-label={`${next.title} / NEXT PROJECT`} data-case-reveal-item>
          <span className="case-navigation__preview" aria-hidden="true"><Image src={next.cover.src} alt="" fill sizes="34vw" /></span>
          <span className="case-navigation__label">NEXT →</span><b>{next.title}</b>
        </TransitionLink>
      </nav>

      {lightbox && createPortal(
        <div ref={lightboxDialog} className={`case-lightbox ${interactionStyles.viewer}${isEditorial ? " case-lightbox--editorial" : ""}${lightboxOpening ? " is-opening" : ""}${lightboxClosing ? " is-closing" : ""}`} role="dialog" aria-modal="true" aria-label={`Image preview: ${lightbox.caption}`} onClick={() => closeLightbox()}>
          <header className="case-lightbox__toolbar" onClick={event => event.stopPropagation()}>
            <span aria-live="polite">{String(lightboxIndex + 1).padStart(2, "0")} / {String(gallery.length).padStart(2, "0")}</span>
            <nav aria-label="Image navigation">
              <button type="button" onClick={() => stepLightbox(-1)} aria-label="Previous image">← PREV</button>
              <button type="button" onClick={() => stepLightbox(1)} aria-label="Next image">NEXT →</button>
              <a href={lightbox.src} target="_blank" rel="noreferrer">ORIGINAL ↗</a>
              <button ref={lightboxClose} type="button" onClick={() => closeLightbox()} aria-label="Close image preview">CLOSE ×</button>
            </nav>
          </header>
          <CaseImageViewport key={lightbox.src} image={lightbox} onStep={stepLightbox} onImageReady={image => {
            const origin = flightOrigin.current;
            flightOrigin.current = null;
            if (origin && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
              flightCleanup.current?.();
              flightCleanup.current = animateImageFlight(image, origin, containedImageBounds(image));
            }
          }} />
          <p aria-live="polite">{lightbox.caption} / {lightbox.note}</p>
          <GalleryThumbnailStrip images={gallery} active={lightboxIndex} onSelect={image => {
            flightCleanup.current?.();
            flightOrigin.current = null;
            setLightbox(image);
          }} />
        </div>,
        document.body,
      )}
    </main>
  );
}
