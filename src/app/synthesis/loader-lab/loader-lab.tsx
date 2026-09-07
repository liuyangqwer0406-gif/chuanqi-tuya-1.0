"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import "./loader-lab.css";

type LoaderSchemeId = "aperture" | "hold" | "quad" | "classic";

interface SchemeDef {
  id: LoaderSchemeId;
  index: string;
  name: string;
  badge: string;
  tip: string;
}

const SCHEMES: SchemeDef[] = [
  {
    id: "aperture",
    index: "01",
    name: "空间光圈曝光破幕",
    badge: "RECOMMENDED",
    tip: "★ 推荐方案：中心光斑呼吸蓄能，就绪时以摄影机光圈由中心极速向外圆形曝光撕裂，无缝透出三维点云与主视觉！",
  },
  {
    id: "hold",
    index: "02",
    name: "触控蓄能超新星",
    badge: "INTERACTIVE",
    tip: "★ 极客把玩：长按屏幕任意位置蓄能，高频压缩能量后从点击坐标释放超新星冲击波，掌控感极强！",
  },
  {
    id: "quad",
    index: "03",
    name: "瑞士网格四分屏拆解",
    badge: "ARCHITECTURAL",
    tip: "★ 理性构成：十字参考线锁定中心，屏幕严谨分为四个象限向四对角对偶滑移淡出，纯正瑞士几何学美感！",
  },
  {
    id: "classic",
    index: "04",
    name: "原版上下卷帘拉起",
    badge: "BASELINE",
    tip: "★ 原版对照：当前线上版本的机械式向上拉帘子，方便您直观比对升级前后的空间感与仪式感差异。",
  },
];

const PHASES = [
  { id: "01", primary: "INITIALIZING", secondary: "SCENE", cn: "初始化场景", detail: "CREATING 3D RENDER CONTEXT" },
  { id: "02", primary: "RESOLVING", secondary: "MATERIALS", cn: "解析材质与图像", detail: "RESOLVING PARTICLES / SHADERS" },
  { id: "03", primary: "BINDING", secondary: "INPUT", cn: "绑定交互输入", detail: "BINDING POINTER / TACTILE INPUT" },
  { id: "04", primary: "VIEW", secondary: "READY", cn: "视图准备完成", detail: "3D LIVING SCENE / PORTFOLIO INDEX" },
];

export function LoaderLab() {
  const [activeScheme, setActiveScheme] = useState<LoaderSchemeId>("aperture");
  const [phaseIndex, setPhaseIndex] = useState<number>(0);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1.0);
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [pointerCoord, setPointerCoord] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [waitingForHold, setWaitingForHold] = useState<boolean>(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const bgHeroRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const holdRafRef = useRef<number | null>(null);
  const autoDetonateTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentPhase = PHASES[phaseIndex];
  const activeDef = SCHEMES.find((s) => s.id === activeScheme) || SCHEMES[0];

  // Execute full reveal choreography based on selected scheme
  const executeReveal = useCallback((origin?: { x: number; y: number }) => {
    const stage = stageRef.current;
    if (!stage) return;

    if (autoDetonateTimerRef.current) {
      clearTimeout(autoDetonateTimerRef.current);
      autoDetonateTimerRef.current = null;
    }
    setWaitingForHold(false);

    const durMult = speed === 0.5 ? 2.0 : 1.0;
    const tl = gsap.timeline({
      onComplete: () => {
        setIsRevealed(true);
        if (stage) gsap.set(stage, { display: "none", autoAlpha: 0 });
      },
    });

    timelineRef.current = tl;

    // Common: fade out stage text & meta
    const title = stage.querySelector(".loader-stage__center");
    const meta = stage.querySelector(".loader-stage__meta");
    const footer = stage.querySelector(".loader-stage__footer");
    const axisV = stage.querySelector(".loader-stage__axis-v");
    const axisH = stage.querySelector(".loader-stage__axis-h");

    tl.to([title, meta, footer].filter(Boolean), {
      autoAlpha: 0,
      y: -18,
      duration: 0.26 * durMult,
      stagger: 0.035,
      ease: "power2.in",
    }, 0);

    // Camera dolly settle on background hero
    if (bgHeroRef.current) {
      gsap.fromTo(
        bgHeroRef.current,
        { scale: 0.982, autoAlpha: 0.8 },
        { scale: 1, autoAlpha: 1, duration: 0.9 * durMult, ease: "power2.out", delay: 0.15 * durMult }
      );
    }

    if (activeScheme === "aperture") {
      // -------------------------------------------------------------
      // Scheme 01: Center Aperture Optical Reveal
      // -------------------------------------------------------------
      const singularity = stage.querySelector<HTMLElement>(".loader-stage__singularity");
      const ring = stage.querySelector<HTMLElement>(".loader-stage__aperture-ring");

      if (singularity) {
        tl.to(singularity, {
          scale: 4.2,
          opacity: 1,
          duration: 0.22 * durMult,
          ease: "power3.in",
        }, 0)
        .to(singularity, {
          autoAlpha: 0,
          duration: 0.15 * durMult,
        }, 0.2 * durMult);
      }

      tl.call(() => {
        stage.classList.add("is-aperture-masked");
        stage.style.setProperty("--hole-x", "50%");
        stage.style.setProperty("--hole-y", "50%");
        stage.style.setProperty("--hole-size", "0%");
      }, [], 0.12 * durMult);

      // Animate mask hole size 0% -> 140%
      const maskObj = { size: 0 };
      tl.to(maskObj, {
        size: 140,
        duration: 0.85 * durMult,
        ease: "expo.inOut",
        onUpdate: () => {
          stage.style.setProperty("--hole-size", `${maskObj.size}%`);
        },
      }, 0.14 * durMult);

      // Animate shockwave laser ring
      if (ring) {
        gsap.set(ring, { left: "50%", top: "50%" });
        tl.fromTo(
          ring,
          { scale: 0, autoAlpha: 1, borderWidth: "5px" },
          { scale: 38, autoAlpha: 0, borderWidth: "1px", duration: 0.85 * durMult, ease: "expo.inOut" },
          0.14 * durMult
        );
      }
    } else if (activeScheme === "hold") {
      // -------------------------------------------------------------
      // Scheme 02: Tactile Hold Detonation from Click Origin
      // -------------------------------------------------------------
      const ox = origin ? origin.x : window.innerWidth / 2;
      const oy = origin ? origin.y : window.innerHeight / 2;
      const ring = stage.querySelector<HTMLElement>(".loader-stage__aperture-ring");

      tl.call(() => {
        stage.classList.add("is-aperture-masked");
        stage.style.setProperty("--hole-x", `${ox}px`);
        stage.style.setProperty("--hole-y", `${oy}px`);
        stage.style.setProperty("--hole-size", "0%");
      }, [], 0.05 * durMult);

      const maskObj = { size: 0 };
      tl.to(maskObj, {
        size: 155,
        duration: 0.8 * durMult,
        ease: "expo.inOut",
        onUpdate: () => {
          stage.style.setProperty("--hole-size", `${maskObj.size}%`);
        },
      }, 0.06 * durMult);

      if (ring) {
        gsap.set(ring, { left: `${ox}px`, top: `${oy}px` });
        tl.fromTo(
          ring,
          { scale: 0, autoAlpha: 1, borderWidth: "6px" },
          { scale: 42, autoAlpha: 0, borderWidth: "1px", duration: 0.82 * durMult, ease: "expo.inOut" },
          0.06 * durMult
        );
      }
    } else if (activeScheme === "quad") {
      // -------------------------------------------------------------
      // Scheme 03: Architectural Quad Split
      // -------------------------------------------------------------
      const quadWrap = stage.querySelector<HTMLElement>(".loader-stage__quad-wrap");
      const cells = stage.querySelectorAll<HTMLElement>(".loader-stage__quad-cell");

      if (quadWrap) quadWrap.classList.add("is-active");
      stage.style.background = "transparent";

      if (cells.length === 4) {
        // [0: Top-Left, 1: Top-Right, 2: Bottom-Left, 3: Bottom-Right]
        tl.to(cells[0], { xPercent: -105, yPercent: -105, duration: 0.78 * durMult, ease: "expo.inOut" }, 0.12 * durMult)
          .to(cells[1], { xPercent: 105, yPercent: -105, duration: 0.78 * durMult, ease: "expo.inOut" }, 0.12 * durMult)
          .to(cells[2], { xPercent: -105, yPercent: 105, duration: 0.78 * durMult, ease: "expo.inOut" }, 0.12 * durMult)
          .to(cells[3], { xPercent: 105, yPercent: 105, duration: 0.78 * durMult, ease: "expo.inOut" }, 0.12 * durMult);
      }

      if (axisV) tl.to(axisV, { scaleY: 0, autoAlpha: 0, duration: 0.35 * durMult, ease: "power2.inOut" }, 0.1 * durMult);
      if (axisH) tl.to(axisH, { scaleX: 0, autoAlpha: 0, duration: 0.35 * durMult, ease: "power2.inOut" }, 0.1 * durMult);
    } else {
      // -------------------------------------------------------------
      // Scheme 04: Classic Production Vertical Shutter (Baseline)
      // -------------------------------------------------------------
      if (axisV) tl.to(axisV, { scaleY: 0, duration: 0.3 * durMult, ease: "power2.inOut" }, 0.15 * durMult);
      if (axisH) tl.to(axisH, { scaleX: 0, duration: 0.3 * durMult, ease: "power2.inOut" }, 0.15 * durMult);
      tl.to(stage, {
        clipPath: "inset(0 0 100% 0)",
        duration: 0.68 * durMult,
        ease: "expo.inOut",
      }, 0.22 * durMult);
    }
  }, [activeScheme, speed]);

  // Master Playback Sequence (Runs 4-phase loading then triggers reveal)
  const playSequence = useCallback(() => {
    timelineRef.current?.kill();
    if (holdRafRef.current) cancelAnimationFrame(holdRafRef.current);
    if (autoDetonateTimerRef.current) clearTimeout(autoDetonateTimerRef.current);

    const stage = stageRef.current;
    if (!stage) return;

    setIsRevealed(false);
    setPhaseIndex(0);
    setHoldProgress(0);
    setIsHolding(false);
    setWaitingForHold(false);

    const durMult = speed === 0.5 ? 2.0 : 1.0;

    // Reset stage appearance & remove modifiers
    gsap.killTweensOf([stage, ...stage.querySelectorAll("*")]);
    stage.classList.remove("is-aperture-masked");
    stage.style.background = "";
    stage.style.removeProperty("--hole-size");
    stage.style.removeProperty("--hole-x");
    stage.style.removeProperty("--hole-y");

    gsap.set(stage, {
      display: "flex",
      autoAlpha: 1,
      clipPath: "none",
      x: 0,
      y: 0,
    });

    const quadWrap = stage.querySelector<HTMLElement>(".loader-stage__quad-wrap");
    const cells = stage.querySelectorAll<HTMLElement>(".loader-stage__quad-cell");
    if (quadWrap) {
      if (activeScheme === "quad") quadWrap.classList.add("is-active");
      else quadWrap.classList.remove("is-active");
    }
    if (cells.length === 4) {
      gsap.set(cells, { xPercent: 0, yPercent: 0, autoAlpha: 1 });
    }

    const ring = stage.querySelector<HTMLElement>(".loader-stage__aperture-ring");
    if (ring) gsap.set(ring, { scale: 0, autoAlpha: 0 });

    const singularity = stage.querySelector<HTMLElement>(".loader-stage__singularity");
    if (singularity) gsap.set(singularity, { scale: 1, autoAlpha: 1 });

    const axisV = stage.querySelector<HTMLElement>(".loader-stage__axis-v");
    const axisH = stage.querySelector<HTMLElement>(".loader-stage__axis-h");
    if (axisV) gsap.set(axisV, { scaleY: 1, autoAlpha: 1 });
    if (axisH) gsap.set(axisH, { scaleX: 1, autoAlpha: 1 });

    const title = stage.querySelector(".loader-stage__center");
    const meta = stage.querySelector(".loader-stage__meta");
    const footer = stage.querySelector(".loader-stage__footer");
    gsap.set([title, meta, footer].filter(Boolean), { autoAlpha: 1, y: 0 });

    // Step through 4 phases with authentic timing
    const tl = gsap.timeline();
    timelineRef.current = tl;

    tl.to({}, { duration: 0.15 })
      .call(() => setPhaseIndex(1), [], 0.45 * durMult)
      .call(() => setPhaseIndex(2), [], 0.9 * durMult)
      .call(() => setPhaseIndex(3), [], 1.35 * durMult);

    if (activeScheme !== "hold") {
      tl.call(() => {
        executeReveal();
      }, [], 1.8 * durMult);
    } else {
      // Scheme 02: Enter waiting for hold state
      tl.call(() => {
        setWaitingForHold(true);
        // Auto-detonate after 3.2s of inactivity so user never gets stranded
        autoDetonateTimerRef.current = setTimeout(() => {
          executeReveal({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
        }, 3200 * durMult);
      }, [], 1.45 * durMult);
    }
  }, [activeScheme, speed, executeReveal]);

  // Initial playback on mount or scheme switch
  useEffect(() => {
    playSequence();
    return () => {
      timelineRef.current?.kill();
      if (holdRafRef.current) cancelAnimationFrame(holdRafRef.current);
      if (autoDetonateTimerRef.current) clearTimeout(autoDetonateTimerRef.current);
    };
  }, [activeScheme, speed]);

  // Keyboard controls: 1-4 to switch, Space to replay
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        playSequence();
      } else if (e.key === "1") setActiveScheme("aperture");
      else if (e.key === "2") setActiveScheme("hold");
      else if (e.key === "3") setActiveScheme("quad");
      else if (e.key === "4") setActiveScheme("classic");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playSequence]);

  // Parallax Tilt on Pointer Move for Aperture Scheme
  const handlePointerMove = (e: React.PointerEvent) => {
    if (activeScheme === "aperture" && !isRevealed && stageRef.current) {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;

      const center = stageRef.current.querySelector<HTMLElement>(".loader-stage__center");
      if (center) {
        gsap.to(center, {
          x: dx * 14,
          y: dy * 10,
          rotateY: dx * 4,
          rotateX: -dy * 4,
          duration: 0.4,
          ease: "power2.out",
          overwrite: "auto",
        });
      }
    }
  };

  // -----------------------------------------------------------------
  // Scheme 02: Hold Charging Handlers
  // -----------------------------------------------------------------
  const handleHoldPointerDown = (e: React.PointerEvent) => {
    if (activeScheme !== "hold" || isRevealed) return;
    setPointerCoord({ x: e.clientX, y: e.clientY });
    setIsHolding(true);

    if (autoDetonateTimerRef.current) {
      clearTimeout(autoDetonateTimerRef.current);
      autoDetonateTimerRef.current = null;
    }

    const startTime = performance.now();
    const chargeDuration = 850; // 0.85s to full charge

    const step = (now: number) => {
      const elapsed = now - startTime;
      const percent = Math.min(100, Math.round((elapsed / chargeDuration) * 100));
      setHoldProgress(percent);

      // Micro-shake stage with escalating frequency
      if (stageRef.current && percent > 15) {
        const shake = (percent / 100) * 3.5;
        gsap.set(stageRef.current, {
          x: (Math.random() - 0.5) * shake,
          y: (Math.random() - 0.5) * shake,
        });
      }

      if (percent >= 100) {
        setIsHolding(false);
        if (stageRef.current) gsap.set(stageRef.current, { x: 0, y: 0 });
        executeReveal({ x: e.clientX, y: e.clientY });
      } else {
        holdRafRef.current = requestAnimationFrame(step);
      }
    };

    holdRafRef.current = requestAnimationFrame(step);
  };

  const handleHoldPointerUp = (e: React.PointerEvent) => {
    if (activeScheme !== "hold" || isRevealed) return;
    if (holdRafRef.current) cancelAnimationFrame(holdRafRef.current);
    setIsHolding(false);
    if (stageRef.current) gsap.to(stageRef.current, { x: 0, y: 0, duration: 0.2 });

    if (holdProgress >= 30) {
      executeReveal({ x: e.clientX, y: e.clientY });
    } else {
      setHoldProgress(0);
    }
  };

  return (
    <main
      className="loader-studio"
      onPointerMove={handlePointerMove}
      onPointerDown={handleHoldPointerDown}
      onPointerUp={handleHoldPointerUp}
    >
      {/* 1. Real Background Portfolio View (Revealed when loader clears) */}
      <section className="loader-studio__canvas-bg" aria-label="Portfolio Home Scene">
        <div className="studio-bg__grid" aria-hidden="true" />
        <div className="studio-bg__ambient-glow" aria-hidden="true" />

        <header className="studio-bg__header">
          <div className="studio-bg__logo">
            <span>026 //</span>
            <b>WEN YIFAN · 温一帆</b>
          </div>
          <nav className="studio-bg__nav">
            <span>WORK</span>
            <span>ABOUT</span>
            <span>ARCHIVE</span>
            <div className="studio-bg__status-badge">
              <i />
              <span>COMMISSIONS OPEN · 2026</span>
            </div>
          </nav>
        </header>

        <div ref={bgHeroRef} className="studio-bg__hero">
          <div className="studio-bg__hero-left">
            <div className="studio-bg__kicker">
              <span className="studio-bg__kicker-pip" />
              <span>VISUAL DESIGN PORTFOLIO / 视觉设计作品集</span>
            </div>
            <h1 className="studio-bg__title">
              <span>VISUAL SYSTEMS</span>
              <b>WITH A PULSE.</b>
            </h1>
            <p className="studio-bg__desc">
              从品牌识别、商业包装到三维影像与互动叙事，建立清楚、可延展的视觉秩序与呼吸节奏。
            </p>
          </div>

          <div className="studio-bg__cards">
            <article className="studio-bg__card">
              <div className="studio-bg__card-meta">
                <span className="studio-bg__card-tag">BRAND IDENTITY // 01</span>
                <span className="studio-bg__card-title">NEURAL ARCHIVE</span>
                <span className="studio-bg__card-desc">生成式品牌符号与动态秩序体系 · 2026</span>
              </div>
              <span className="studio-bg__card-index">01</span>
            </article>

            <article className="studio-bg__card">
              <div className="studio-bg__card-meta">
                <span className="studio-bg__card-tag">SPATIAL IMAGE // 02</span>
                <span className="studio-bg__card-title">SYLVA LIVING WORLD</span>
                <span className="studio-bg__card-desc">黑曜三维粒子空间生态与着色器 · 2025</span>
              </div>
              <span className="studio-bg__card-index">02</span>
            </article>

            <article className="studio-bg__card">
              <div className="studio-bg__card-meta">
                <span className="studio-bg__card-tag">INTERACTIVE STORY // 03</span>
                <span className="studio-bg__card-title">CHRONO DYNAMICS</span>
                <span className="studio-bg__card-desc">时间切片与多维交互叙事装置 · 2026</span>
              </div>
              <span className="studio-bg__card-index">03</span>
            </article>
          </div>
        </div>

        <footer className="studio-bg__footer">
          <span>WEN YIFAN © 2026 ARCHIVE · ALL RIGHTS RESERVED</span>
          <span>LAT 30.2741° N / LON 120.1551° E · HANGZHOU STUDIO</span>
        </footer>
      </section>

      {/* 2. Authentic Foreground Preloader Stage */}
      <div
        ref={stageRef}
        className="loader-studio__stage"
        style={{ cursor: activeScheme === "hold" ? "crosshair" : "default" }}
      >
        {/* Shockwave laser ring (Used in Scheme 01 & 02) */}
        <div className="loader-stage__aperture-ring" aria-hidden="true" />

        {/* Crosshair guidelines */}
        <div className="loader-stage__axis-v" />
        <div className="loader-stage__axis-h" />

        {/* Singularity Pulse Orb (Used in Scheme 01 Aperture) */}
        {activeScheme === "aperture" && (
          <div className="loader-stage__singularity" aria-hidden="true" />
        )}

        {/* Architectural Quad Split Grid (Used in Scheme 03) */}
        <div className="loader-stage__quad-wrap" aria-hidden="true">
          <div className="loader-stage__quad-cell" />
          <div className="loader-stage__quad-cell" />
          <div className="loader-stage__quad-cell" />
          <div className="loader-stage__quad-cell" />
        </div>

        {/* Top Header Meta */}
        <header className="loader-stage__meta">
          <div className="loader-stage__meta-left">
            <span className="loader-stage__meta-pip" />
            <span>WEN YIFAN / 026</span>
          </div>
          <div>VISUAL ARCHIVE / 2026</div>
        </header>

        {/* Center Technical Text Block */}
        <div className="loader-stage__center">
          <div className="loader-stage__title-group">
            <h2 className="loader-stage__title-line">
              <b>{currentPhase.primary}</b>
            </h2>
            <h2 className="loader-stage__title-line">
              <b>{currentPhase.secondary}</b>
            </h2>
            <div className="loader-stage__sub-row">
              <span className="loader-stage__sub-cn">{currentPhase.cn}</span>
            </div>
          </div>

          <div className="loader-stage__phase-axis">
            <span>{currentPhase.id}</span>
            <div className="loader-stage__phase-bars">
              {PHASES.map((p, i) => (
                <span
                  key={p.id}
                  className={`loader-stage__phase-bar ${i <= phaseIndex ? "is-active" : ""}`}
                />
              ))}
            </div>
            <span>04</span>
          </div>
        </div>

        {/* Bottom Rail & Status */}
        <footer className="loader-stage__footer">
          <div className="loader-stage__rail">
            <span
              className="loader-stage__rail-fill"
              style={{ transform: `scaleX(${(phaseIndex + 1) / PHASES.length})` }}
            />
          </div>

          <div className="loader-stage__status-row">
            <span>PHASE STATUS</span>
            <span className="loader-stage__status-detail">{currentPhase.detail}</span>
          </div>
        </footer>

        {/* Hold Overlay with Interactive Reticle (Scheme 02) */}
        {activeScheme === "hold" && !isRevealed && (
          <div className="loader-stage__hold-overlay" aria-hidden="true">
            {waitingForHold && (
              <div className="loader-stage__hold-hint">
                <span>PRESS & HOLD ANYWHERE TO DETONATE</span>
                <span>长按屏幕充能释放超新星冲击波（或静待自动破幕）</span>
              </div>
            )}

            {isHolding && (
              <div
                className="loader-stage__reticle"
                style={{ left: pointerCoord.x, top: pointerCoord.y }}
              >
                <span className="loader-stage__hold-number">{holdProgress}%</span>
                <span className="loader-stage__reticle-ring" />
                <span className="loader-stage__reticle-center" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Bottom Docked Director Console */}
      <nav className="loader-director-dock" aria-label="Loader Scheme Director">
        <div className="loader-director__tabs">
          {SCHEMES.map((scheme) => (
            <button
              key={scheme.id}
              type="button"
              className={`loader-director__tab ${activeScheme === scheme.id ? "is-active" : ""}`}
              onClick={() => setActiveScheme(scheme.id)}
            >
              <span className="loader-director__tab-num">[{scheme.index}] {scheme.badge}</span>
              <span className="loader-director__tab-title">{scheme.name}</span>
            </button>
          ))}
        </div>

        <div className="loader-director__controls">
          <div className="loader-director__actions">
            <button
              type="button"
              className="loader-director__replay-btn"
              onClick={playSequence}
              title="重播全流程 (快捷键 Space)"
            >
              <span>⟲ 重播加载全流程</span>
            </button>

            <button
              type="button"
              className={`loader-director__speed-btn ${speed === 1.0 ? "is-active" : ""}`}
              onClick={() => setSpeed(1.0)}
            >
              1.0X 正常
            </button>

            <button
              type="button"
              className={`loader-director__speed-btn ${speed === 0.5 ? "is-active" : ""}`}
              onClick={() => setSpeed(0.5)}
            >
              0.5X 慢放观察
            </button>
          </div>

          <div className="loader-director__tip">
            {activeDef.tip}
          </div>
        </div>
      </nav>
    </main>
  );
}