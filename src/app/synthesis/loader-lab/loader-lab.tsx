"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import "./loader-lab.css";

type LoaderConcept = "hold" | "lens" | "slider" | "decryptor";

interface ConceptDef {
  id: LoaderConcept;
  label: string;
  tag: string;
  tip: string;
}

const CONCEPTS: ConceptDef[] = [
  { id: "hold", label: "方案 A · 触控蓄能破壁", tag: "Press & Hold Singularity", tip: "在屏幕任意位置长按鼠标或屏幕充能，达到 100% 触发超新星撕裂破壁！" },
  { id: "lens", label: "方案 B · 空间探照透镜", tag: "Spatial Caustic Lens", tip: "晃动鼠标感受 3D 景深倾斜与透镜扫描，点击任意处释放冲击波进入！" },
  { id: "slider", label: "方案 C · 物理磁吸滑块", tag: "Kinetic Drag Gateway", tip: "按住底部的信号橙滑块向右拖动，松手体验真实物理惯性回弹或冲刺解锁！" },
  { id: "decryptor", label: "方案 D · 矩阵声波解密", tag: "Interactive Matrix", tip: "鼠标悬停标题即可实时扰动字符乱码，点击任意处直接贯穿入场。" },
];

export function LoaderLab() {
  const [activeConcept, setActiveConcept] = useState<LoaderConcept>("hold");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number }>(() => {
    if (typeof window !== "undefined") {
      return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    }
    return { x: 0, y: 0 };
  });
  const [sliderVal, setSliderVal] = useState<number>(0);
  const [decryptedText, setDecryptedText] = useState<string>("WEN YIFAN");

  const stageRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const holdRafRef = useRef<number | null>(null);
  const sliderTrackRef = useRef<HTMLDivElement>(null);
  const isDraggingSlider = useRef<boolean>(false);

  // Reset stage
  const resetStage = useCallback(() => {
    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }
    const stage = stageRef.current;
    if (!stage) return;

    gsap.killTweensOf(stage);
    gsap.set(stage, {
      display: "flex",
      autoAlpha: 1,
      clipPath: "circle(150% at 50% 50%)",
      clearProps: "transform,yPercent,xPercent",
    });
    setHoldProgress(0);
    setSliderVal(0);
    setIsPlaying(false);
  }, []);

  // -----------------------------------------------------------------
  // Concept A: Hold Charging logic
  // -----------------------------------------------------------------
  const completeHoldDetonation = useCallback((originX: number, originY: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    setIsPlaying(true);

    const tl = gsap.timeline({
      onComplete: () => {
        setIsPlaying(false);
      },
    });

    // Detonate shockwave from touch point
    tl.to(stage, {
      clipPath: `circle(160% at ${originX}px ${originY}px)`,
      duration: 0.75,
      ease: "expo.inOut",
    }, 0);
  }, []);

  // Handle pointer down for hold
  const handleHoldStart = (e: React.PointerEvent) => {
    if (activeConcept !== "hold" || isPlaying) return;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX;
    const y = e.clientY;
    setPointerPos({ x, y });
    setIsHolding(true);

    let curr = 0;
    const startTime = performance.now();
    const chargeDuration = 1100; // 1.1s to full charge

    const step = (now: number) => {
      const elapsed = now - startTime;
      curr = Math.min(100, Math.round((elapsed / chargeDuration) * 100));
      setHoldProgress(curr);

      // Micro-shake stage as energy compresses
      if (stageRef.current && curr > 25) {
        const shake = (curr / 100) * 4;
        gsap.set(stageRef.current, {
          x: (Math.random() - 0.5) * shake,
          y: (Math.random() - 0.5) * shake,
        });
      }

      if (curr >= 100) {
        setIsHolding(false);
        completeHoldDetonation(x, y);
      } else {
        holdRafRef.current = requestAnimationFrame(step);
      }
    };
    holdRafRef.current = requestAnimationFrame(step);
  };

  const handleHoldEnd = () => {
    if (activeConcept !== "hold" || isPlaying) return;
    if (holdRafRef.current) {
      cancelAnimationFrame(holdRafRef.current);
      holdRafRef.current = null;
    }
    setIsHolding(false);

    // Spring recoil decay if released prematurely
    if (holdProgress < 100) {
      if (stageRef.current) gsap.to(stageRef.current, { x: 0, y: 0, duration: 0.2 });
      const decay = { val: holdProgress };
      gsap.to(decay, {
        val: 0,
        duration: 0.35,
        ease: "power2.out",
        onUpdate: () => setHoldProgress(Math.round(decay.val)),
      });
    }
  };

  // -----------------------------------------------------------------
  // Concept B: Spatial Lens Mouse Move & 3D Tilt
  // -----------------------------------------------------------------
  const handleLensMouseMove = (e: React.MouseEvent) => {
    if (activeConcept !== "lens") return;
    const card = stageRef.current?.querySelector<HTMLElement>(".lens__card");
    const spot = stageRef.current?.querySelector<HTMLElement>(".lens__spotlight");
    if (!card || !spot) return;

    const rect = stageRef.current!.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);

    // Smooth volumetric light follow
    gsap.to(spot, {
      x: e.clientX,
      y: e.clientY,
      duration: 0.25,
      ease: "power2.out",
      overwrite: "auto",
    });

    // 3D card tilt
    gsap.to(card, {
      rotateY: dx * 14,
      rotateX: -dy * 14,
      duration: 0.4,
      ease: "power2.out",
      overwrite: "auto",
    });
  };

  const triggerLensReveal = (e: React.MouseEvent) => {
    if (isPlaying) return;
    setIsPlaying(true);
    const stage = stageRef.current;
    if (!stage) return;

    const x = e.clientX;
    const y = e.clientY;
    const spot = stage.querySelector(".lens__spotlight");

    const tl = gsap.timeline({
      onComplete: () => setIsPlaying(false),
    });

    if (spot) {
      tl.to(spot, { scale: 5, autoAlpha: 0, duration: 0.45, ease: "power3.in" }, 0);
    }
    tl.to(stage, {
      clipPath: `circle(150% at ${x}px ${y}px)`,
      duration: 0.75,
      ease: "expo.inOut",
    }, 0.1);
  };

  // -----------------------------------------------------------------
  // Concept C: Slider Drag
  // -----------------------------------------------------------------
  const handleSliderPointerDown = (e: React.PointerEvent) => {
    if (activeConcept !== "slider" || isPlaying) return;
    isDraggingSlider.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handleSliderPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingSlider.current || !sliderTrackRef.current) return;
    const rect = sliderTrackRef.current.getBoundingClientRect();
    const clampedX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = Math.round((clampedX / rect.width) * 100);
    setSliderVal(percent);

    // Live curtain peel matching slider
    if (stageRef.current) {
      gsap.set(stageRef.current, {
        clipPath: `inset(0 ${percent}% 0 0)`,
      });
    }
  };

  const handleSliderPointerUp = () => {
    if (!isDraggingSlider.current) return;
    isDraggingSlider.current = false;

    if (sliderVal >= 60) {
      // Over threshold: Complete unlock with inertia
      setIsPlaying(true);
      const tl = gsap.timeline({
        onComplete: () => setIsPlaying(false),
      });
      tl.to({ val: sliderVal }, {
        val: 100,
        duration: 0.35,
        ease: "power4.out",
        onUpdate: function () {
          const v = Math.round(this.targets()[0].val);
          setSliderVal(v);
          if (stageRef.current) {
            gsap.set(stageRef.current, { clipPath: `inset(0 ${v}% 0 0)` });
          }
        },
      });
    } else {
      // Under threshold: Spring recoil back to 0
      const bounce = { val: sliderVal };
      gsap.to(bounce, {
        val: 0,
        duration: 0.45,
        ease: "elastic.out(1, 0.5)",
        onUpdate: () => {
          const v = Math.round(bounce.val);
          setSliderVal(v);
          if (stageRef.current) {
            gsap.set(stageRef.current, { clipPath: `inset(0 ${v}% 0 0)` });
          }
        },
      });
    }
  };

  // -----------------------------------------------------------------
  // Concept D: Interactive Decryptor
  // -----------------------------------------------------------------
  const handleDecryptorHover = () => {
    const target = "WEN YIFAN";
    const glyphs = "!@#$%^&*()_+~|}{[]:;?><01";
    let iteration = 0;
    const interval = setInterval(() => {
      setDecryptedText(() =>
        target
          .split("")
          .map((letter, index) => {
            if (index < iteration) return target[index];
            return glyphs[Math.floor(Math.random() * glyphs.length)];
          })
          .join("")
      );
      if (iteration >= target.length) clearInterval(interval);
      iteration += 1 / 2;
    }, 30);
  };

  const triggerDecryptorReveal = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    const stage = stageRef.current;
    if (!stage) return;
    const tl = gsap.timeline({
      onComplete: () => setIsPlaying(false),
    });
    tl.to(stage, {
      clipPath: "inset(0 100% 0 0)",
      duration: 0.72,
      ease: "expo.inOut",
    });
  };

  // When concept changes, reset stage and initiate view
  useEffect(() => {
    resetStage();
    const stage = stageRef.current;
    if (!stage) return;

    if (activeConcept === "hold") {
      gsap.set(stage, { clipPath: "circle(150% at 50% 50%)" });
    } else if (activeConcept === "slider") {
      gsap.set(stage, { clipPath: "inset(0 0% 0 0)" });
    } else if (activeConcept === "lens") {
      gsap.set(stage, { clipPath: "circle(150% at 50% 50%)" });
    } else if (activeConcept === "decryptor") {
      gsap.set(stage, { clipPath: "inset(0 0% 0 0)" });
    }
  }, [activeConcept, resetStage]);

  // Spacebar shortcut to reset
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        resetStage();
      }
      if (["1", "2", "3", "4"].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (CONCEPTS[idx]) {
          setActiveConcept(CONCEPTS[idx].id);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [resetStage]);

  const currentConceptDef = CONCEPTS.find((c) => c.id === activeConcept) || CONCEPTS[0];

  return (
    <main className="loader-lab">
      {/* 1. Underlying Mock Hero */}
      <div className="loader-lab__hero-mock">
        <header className="hero-mock__nav">
          <div>
            <b>WEN YIFAN</b> / VISUAL DESIGN 2026
          </div>
          <div>BEIJING &bull; SHANGHAI</div>
          <div>INTERACTIVE ARRIVAL: SUCCESS</div>
        </header>

        <div className="hero-mock__body">
          <div className="hero-mock__tag">GENERATIVE 3D &bull; PHYSICAL SHADERS</div>
          <h1 className="hero-mock__title">
            SYNTHESIS OF VISUAL DENSITY &amp; COMPUTED MOTION
          </h1>
          <p className="hero-mock__desc">
            温一帆的视觉设计作品集。探索品牌几何、流体着色器与三维活体生态的数字边界。
          </p>
          <div>
            <a href="#projects" className="hero-mock__cta">
              <span>EXPLORE ARCHIVE</span>
              <span>&nearr;</span>
            </a>
          </div>
        </div>

        <footer className="hero-mock__footer">
          <div>GL_VERSION: WEBGL 2.0</div>
          <div>MOSS BLADES: 124,000 ACTIVE</div>
          <div>TACTILE FEEDBACK: CALIBRATED</div>
        </footer>
      </div>

      {/* 2. Interactive Loader Stage */}
      <div
        ref={stageRef}
        className={`loader-stage stage--${activeConcept}`}
        onPointerDown={activeConcept === "hold" ? handleHoldStart : undefined}
        onPointerUp={activeConcept === "hold" ? handleHoldEnd : undefined}
        onPointerLeave={activeConcept === "hold" ? handleHoldEnd : undefined}
        onMouseMove={activeConcept === "lens" ? handleLensMouseMove : undefined}
      >
        {/* ================= Concept A: Hold to Charge ================= */}
        {activeConcept === "hold" && (
          <>
            <div className="hold__center">
              <div style={{ fontFamily: "var(--lab-mono)", fontSize: "0.8rem", letterSpacing: "0.25em", color: "var(--lab-signal)", marginBottom: "1.2rem" }}>
                [ TACTILE KINETIC IGNITION ]
              </div>
              <div className="hold__title">WEN YIFAN</div>
              <div className="hold__progress-meter">
                <div className="hold__progress-bar">
                  <div className="hold__progress-fill" style={{ width: `${holdProgress}%` }} />
                </div>
                <span>{holdProgress}%</span>
              </div>
            </div>

            {/* Dynamic reticle following pointer */}
            <div
              className="hold__reticle"
              style={{
                left: pointerPos.x,
                top: pointerPos.y,
                opacity: isHolding ? 1 : 0.45,
                transform: `translate(-50%, -50%) scale(${isHolding ? 1 + (holdProgress / 100) * 0.5 : 1})`,
              }}
            >
              <div className="hold__reticle-ring hold__reticle-ring--outer" />
              <div className="hold__reticle-ring hold__reticle-ring--mid" />
              <div className="hold__reticle-core" />
            </div>

            <div className="hold__prompt" style={{ opacity: isHolding ? 0.3 : 1 }}>
              <span>{isHolding ? "CHARGING SINGULARITY..." : "HOLD ANYWHERE TO DETONATE"}</span>
              <b>长按屏幕任意处蓄能破壁</b>
            </div>
          </>
        )}

        {/* ================= Concept B: Spatial Caustic Lens ================= */}
        {activeConcept === "lens" && (
          <>
            <div className="lens__grid" />
            <div className="lens__spotlight" />
            <div className="lens__card" onClick={triggerLensReveal}>
              <div className="lens__hud-tag">[ SPATIAL 3D PERSPECTIVE LENS ]</div>
              <div className="lens__title">WEN YIFAN // 2026</div>
              <div>
                <button className="lens__click-cta">
                  <span>CLICK ANYWHERE TO BREACH</span>
                  <span>&rarr;</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* ================= Concept C: Kinetic Magnetic Slider ================= */}
        {activeConcept === "slider" && (
          <>
            <header className="slider__header">
              <div>VOL. 2026 // PHYSICAL LOCK</div>
              <div>DRAG RATIO: {sliderVal}%</div>
            </header>

            <div className="slider__center">
              <div className="slider__title">WEN YIFAN</div>
              <div className="slider__sub">PORTFOLIO OF VISUAL ARCHIVES</div>
            </div>

            <div className="slider__track-wrap">
              <div
                ref={sliderTrackRef}
                className="slider__track"
                onPointerDown={handleSliderPointerDown}
                onPointerMove={handleSliderPointerMove}
                onPointerUp={handleSliderPointerUp}
              >
                <div className="slider__track-fill" style={{ width: `${sliderVal}%` }} />
                <div
                  className="slider__thumb"
                  style={{
                    left: `calc(${sliderVal}% * 0.88)`,
                  }}
                >
                  &rarr;
                </div>
                <div className="slider__track-label">
                  {sliderVal > 5 ? `DISRUPTING ${sliderVal}%` : "SLIDE TO DECRYPT ARCHIVE &rarr;"}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ================= Concept D: Interactive Decryptor ================= */}
        {activeConcept === "decryptor" && (
          <>
            <div className="decryptor__grid">
              <div className="decryptor__grid-h" style={{ top: "30%" }} />
              <div className="decryptor__grid-h" style={{ top: "50%" }} />
              <div className="decryptor__grid-h" style={{ top: "70%" }} />
              <div className="decryptor__grid-v" style={{ left: "25%" }} />
              <div className="decryptor__grid-v" style={{ left: "50%" }} />
              <div className="decryptor__grid-v" style={{ left: "75%" }} />
            </div>

            <div className="decryptor__center" onClick={triggerDecryptorReveal}>
              <div className="decryptor__label">[ HOVER OVER TITLE TO SCRAMBLE &bull; CLICK TO UNLOCK ]</div>
              <div className="decryptor__title" onMouseEnter={handleDecryptorHover}>
                {decryptedText}
              </div>
              <div className="decryptor__stats">
                <div>GRID: <b>ACTIVE</b></div>
                <div>SCRAMBLE: <b>READY</b></div>
                <div>FPS: <b>60.0</b></div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 3. Docked Tweaks Console */}
      <nav className="lab-dock" aria-label="Interactive Controls">
        <div className="dock__tabs">
          {CONCEPTS.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setActiveConcept(c.id)}
              className={`dock__tab ${activeConcept === c.id ? "is-active" : ""}`}
            >
              <span>{String.fromCharCode(65 + i)}. {c.label}</span>
            </button>
          ))}
        </div>

        <div className="dock__controls">
          <div className="dock__actions">
            <button onClick={resetStage} className={`dock__btn dock__btn--primary ${isPlaying ? "is-playing" : ""}`}>
              <span>&orarr; 重置闭幕 (Space)</span>
            </button>
            <span style={{ color: "var(--lab-text)", fontWeight: 500, fontSize: "0.76rem" }}>
              💡 {currentConceptDef.tip}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span className="dock__badge">HIGH-TACTILE &bull; GSAP KINETIC</span>
            <span>按键 [1-4] 切换</span>
          </div>
        </div>
      </nav>
    </main>
  );
}