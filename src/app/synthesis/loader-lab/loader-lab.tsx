"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import "./loader-lab.css";

type LoaderConcept = "decryptor" | "fusion" | "swiss" | "synthesis";

const CONCEPTS: { id: LoaderConcept; label: string; tag: string }[] = [
  { id: "decryptor", label: "方案 1 · 先锋字符解密", tag: "Matrix Decryptor" },
  { id: "fusion", label: "方案 2 · 信号橙光子聚变", tag: "Signal Fusion" },
  { id: "swiss", label: "方案 3 · 瑞士极简字阶", tag: "Swiss Monument" },
  { id: "synthesis", label: "方案 4 · 科技工坊 2.0", tag: "Synthesis Refined" },
];

export function LoaderLab() {
  const [activeConcept, setActiveConcept] = useState<LoaderConcept>("fusion");
  const [duration, setDuration] = useState<number>(1.6);
  const [slowMo, setSlowMo] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [counterVal, setCounterVal] = useState<number>(0);
  const [decryptedText, setDecryptedText] = useState<string>("WEN YIFAN");

  const stageRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  // Play animation for active concept
  const playAnimation = useCallback(() => {
    if (timelineRef.current) {
      timelineRef.current.kill();
      timelineRef.current = null;
    }

    const stage = stageRef.current;
    if (!stage) return;

    const timeScale = slowMo ? 0.25 : 1;
    setIsPlaying(true);
    setCounterVal(0);

    // Reset common stage styles
    gsap.set(stage, {
      display: "flex",
      autoAlpha: 1,
      clearProps: "clipPath,transform,yPercent,xPercent",
    });

    const tl = gsap.timeline({
      defaults: { ease: "power3.out" },
      onComplete: () => {
        setIsPlaying(false);
      },
    });
    timelineRef.current = tl;
    tl.timeScale(timeScale);

    // -------------------------------------------------------------
    // Concept 1: Decryptor (Matrix / Engineering Grid)
    // -------------------------------------------------------------
    if (activeConcept === "decryptor") {
      const hLines = stage.querySelectorAll(".decryptor__grid-h");
      const vLines = stage.querySelectorAll(".decryptor__grid-v");
      const center = stage.querySelector(".decryptor__center");
      const leftDoor = stage.querySelector(".stage--decryptor__left");
      const rightDoor = stage.querySelector(".stage--decryptor__right");

      gsap.set([hLines, vLines], { scaleX: 0, scaleY: 0 });
      gsap.set(center, { autoAlpha: 0, scale: 0.96 });

      tl.to(hLines, { scaleX: 1, duration: 0.4, stagger: 0.05, ease: "expo.out" }, 0)
        .to(vLines, { scaleY: 1, duration: 0.4, stagger: 0.05, ease: "expo.out" }, 0.1)
        .to(center, { autoAlpha: 1, scale: 1, duration: 0.35 }, 0.2);

      // Scramble text effect
      const target = "WEN YIFAN";
      const glyphs = "!@#$%^&*()_+~|}{[]:;?><01";
      const counterObj = { val: 0 };

      tl.to(counterObj, {
        val: 100,
        duration: duration * 0.75,
        ease: "power2.inOut",
        onUpdate: () => {
          const progress = counterObj.val / 100;
          setCounterVal(Math.round(counterObj.val));
          const settledChars = Math.floor(progress * target.length);
          let str = target.slice(0, settledChars);
          for (let i = settledChars; i < target.length; i++) {
            if (target[i] === " ") {
              str += " ";
            } else {
              str += glyphs[Math.floor(Math.random() * glyphs.length)];
            }
          }
          setDecryptedText(str);
        },
      }, 0.2);

      // Exit Handoff: Split curtain left and right
      tl.to(center, { autoAlpha: 0, scale: 1.05, duration: 0.3, ease: "power2.in" }, `+=${duration * 0.15}`);
      if (leftDoor && rightDoor) {
        tl.to(leftDoor, { xPercent: -100, duration: 0.65, ease: "expo.inOut" }, "-=0.1")
          .to(rightDoor, { xPercent: 100, duration: 0.65, ease: "expo.inOut" }, "<0.02");
      } else {
        tl.to(stage, { clipPath: "inset(0 100% 0 0)", duration: 0.65, ease: "expo.inOut" }, "-=0.1");
      }
    }

    // -------------------------------------------------------------
    // Concept 2: Signal Fusion (Molten Core & Laser Slicing)
    // -------------------------------------------------------------
    else if (activeConcept === "fusion") {
      const orb = stage.querySelector(".fusion__orb");
      const rings = stage.querySelectorAll(".fusion__ring");
      const laser = stage.querySelector(".fusion__laser");
      const topHalf = stage.querySelector(".stage--fusion__top");
      const botHalf = stage.querySelector(".stage--fusion__bot");
      const counterEl = stage.querySelector(".fusion__counter");

      gsap.set(orb, { scale: 0, autoAlpha: 0 });
      gsap.set(rings, { scale: 0.5, autoAlpha: 0 });
      gsap.set(laser, { scaleX: 0, autoAlpha: 0 });
      gsap.set(counterEl, { autoAlpha: 0, y: 10 });

      // Core ignition
      tl.to(orb, { scale: 1, autoAlpha: 1, duration: 0.4, ease: "back.out(2)" }, 0)
        .to(counterEl, { autoAlpha: 1, y: 0, duration: 0.3 }, 0.1);

      // Expanding harmonic waves
      rings.forEach((ring, idx) => {
        tl.fromTo(
          ring,
          { scale: 0.6, autoAlpha: 0.8 },
          {
            scale: 2.4 + idx * 0.4,
            autoAlpha: 0,
            duration: 0.7,
            repeat: 1,
            ease: "power2.out",
          },
          0.15 + idx * 0.12
        );
      });

      // Counter progress
      const counterObj = { val: 0 };
      tl.to(counterObj, {
        val: 100,
        duration: duration * 0.75,
        ease: "power3.inOut",
        onUpdate: () => setCounterVal(Math.round(counterObj.val)),
      }, 0.1);

      // Laser blade ignition
      tl.to(orb, { scale: 0.2, duration: 0.15, ease: "power4.in" }, `+=${duration * 0.05}`)
        .to(laser, { autoAlpha: 1, scaleX: 1, duration: 0.28, ease: "expo.out" }, ">0.05")
        .to(counterEl, { autoAlpha: 0, duration: 0.15 }, "<");

      // Split open top and bottom halves
      if (topHalf && botHalf) {
        tl.to(topHalf, { yPercent: -100, duration: 0.7, ease: "expo.inOut" }, ">0.08")
          .to(botHalf, { yPercent: 100, duration: 0.7, ease: "expo.inOut" }, "<0.02");
      } else {
        tl.to(stage, { clipPath: "inset(50% 0 50% 0)", duration: 0.65, ease: "expo.inOut" }, ">0.08");
      }
    }

    // -------------------------------------------------------------
    // Concept 3: Swiss Monument (Typographic Editorial Reveal)
    // -------------------------------------------------------------
    else if (activeConcept === "swiss") {
      const texts = stage.querySelectorAll(".swiss__text");
      const footer = stage.querySelector(".swiss__footer");

      gsap.set(texts, { yPercent: 130, rotate: 2 });
      gsap.set(footer, { autoAlpha: 0, y: 15 });

      tl.to(texts, {
        yPercent: 0,
        rotate: 0,
        duration: 0.65,
        stagger: 0.08,
        ease: "power4.out",
      }, 0)
        .to(footer, { autoAlpha: 1, y: 0, duration: 0.4 }, 0.2);

      const counterObj = { val: 0 };
      tl.to(counterObj, {
        val: 100,
        duration: duration * 0.75,
        ease: "power2.inOut",
        onUpdate: () => setCounterVal(Math.round(counterObj.val)),
      }, 0.15);

      // Elegant editorial slide-up
      tl.to(texts, { yPercent: -130, duration: 0.45, stagger: 0.05, ease: "power3.in" }, `+=${duration * 0.1}`)
        .to(stage, { yPercent: -100, duration: 0.75, ease: "expo.inOut" }, "-=0.15");
    }

    // -------------------------------------------------------------
    // Concept 4: Synthesis 2.0 (High-End Technical Studio)
    // -------------------------------------------------------------
    else if (activeConcept === "synthesis") {
      const panel = stage.querySelector(".synthesis__panel");
      const bar = stage.querySelector(".synthesis__bar");
      const scan = stage.querySelector(".synthesis__scan");
      const title = stage.querySelector(".synthesis__title");

      gsap.set(panel, { autoAlpha: 0, scale: 0.98, y: 15 });
      gsap.set(title, { autoAlpha: 0, y: 25 });
      gsap.set(bar, { scaleX: 0 });

      tl.to(panel, { autoAlpha: 1, scale: 1, y: 0, duration: 0.4, ease: "power3.out" }, 0)
        .to(title, { autoAlpha: 1, y: 0, duration: 0.45, ease: "power4.out" }, 0.15);

      if (scan) {
        tl.to(scan, { xPercent: 550, duration: 0.9, repeat: 1, ease: "none" }, 0.1);
      }

      const counterObj = { val: 0 };
      tl.to(counterObj, {
        val: 100,
        duration: duration * 0.75,
        ease: "power2.inOut",
        onUpdate: () => {
          setCounterVal(Math.round(counterObj.val));
          if (bar) gsap.set(bar, { scaleX: counterObj.val / 100 });
        },
      }, 0.1);

      // Shutter curtain exit
      tl.to(panel, { autoAlpha: 0, scale: 0.95, duration: 0.35, ease: "power2.in" }, `+=${duration * 0.15}`)
        .to(stage, { clipPath: "inset(0 0 100% 0)", duration: 0.72, ease: "expo.inOut" }, "-=0.15");
    }
  }, [activeConcept, duration, slowMo]);

  // Trigger on mount or concept change
  useEffect(() => {
    playAnimation();
    return () => {
      timelineRef.current?.kill();
    };
  }, [playAnimation]);

  // Spacebar shortcut to replay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        playAnimation();
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
  }, [playAnimation]);

  return (
    <main className="loader-lab">
      {/* 1. Underlying Mock Hero — Revealed when Loader exits */}
      <div className="loader-lab__hero-mock">
        <header className="hero-mock__nav">
          <div>
            <b>WEN YIFAN</b> / PORTFOLIO 2026
          </div>
          <div>BEIJING &bull; SHANGHAI</div>
          <div>SYSTEM HARMONY : READY</div>
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
          <div>FPS: 60.0 PERFECT</div>
        </footer>
      </div>

      {/* 2. Dynamic Loader Stage */}
      <div ref={stageRef} className={`loader-stage stage--${activeConcept}`}>
        {/* Concept 1: Decryptor */}
        {activeConcept === "decryptor" && (
          <>
            <div className="stage--decryptor__left" style={{ position: "absolute", inset: "0 50% 0 0", background: "#060709", zIndex: 1 }} />
            <div className="stage--decryptor__right" style={{ position: "absolute", inset: "0 0 0 50%", background: "#060709", zIndex: 1 }} />
            <div className="decryptor__grid" style={{ zIndex: 2 }}>
              <div className="decryptor__grid-h" style={{ top: "25%" }} />
              <div className="decryptor__grid-h" style={{ top: "50%" }} />
              <div className="decryptor__grid-h" style={{ top: "75%" }} />
              <div className="decryptor__grid-v" style={{ left: "20%" }} />
              <div className="decryptor__grid-v" style={{ left: "50%" }} />
              <div className="decryptor__grid-v" style={{ left: "80%" }} />
            </div>
            <div className="decryptor__center" style={{ zIndex: 3 }}>
              <div className="decryptor__label">[ SYSTEM INITIALIZING &bull; LAT 31.23&deg; N ]</div>
              <div className="decryptor__title">{decryptedText}</div>
              <div className="decryptor__stats">
                <div>BUFFER: <b>100% OK</b></div>
                <div>SCENE: <b>3D WORLD</b></div>
                <div>STATUS: <b>READY</b></div>
              </div>
              <div className="decryptor__counter">{counterVal}%</div>
            </div>
          </>
        )}

        {/* Concept 2: Signal Fusion */}
        {activeConcept === "fusion" && (
          <>
            <div className="stage--fusion__top" style={{ position: "absolute", inset: "0 0 50% 0", background: "#050608", zIndex: 1 }} />
            <div className="stage--fusion__bot" style={{ position: "absolute", inset: "50% 0 0 0", background: "#050608", zIndex: 1 }} />
            <div className="fusion__laser" style={{ top: "50%", zIndex: 3 }} />
            <div className="fusion__core" style={{ zIndex: 2 }}>
              <div className="fusion__orb" />
              <div className="fusion__ring" style={{ width: "100px", height: "100px" }} />
              <div className="fusion__ring" style={{ width: "160px", height: "160px" }} />
              <div className="fusion__ring" style={{ width: "220px", height: "220px" }} />
              <div className="fusion__counter">{counterVal}%</div>
            </div>
          </>
        )}

        {/* Concept 3: Swiss Monument */}
        {activeConcept === "swiss" && (
          <>
            <header className="swiss__header">
              <div>VOL. 2026 // WEN YIFAN DESIGN</div>
            </header>
            <div className="swiss__main">
              <div className="swiss__line"><div className="swiss__text">VISUAL</div></div>
              <div className="swiss__line"><div className="swiss__text">PORTFOLIO</div></div>
              <div className="swiss__line"><div className="swiss__text" style={{ color: "var(--lab-signal)" }}>SYNTHESIS</div></div>
            </div>
            <footer className="swiss__footer">
              <div style={{ fontFamily: "var(--lab-mono)", fontSize: "0.85rem", color: "var(--lab-muted)" }}>
                <div>EDITORIAL BRUTALISM</div>
                <div>AUTONOMOUS MOTION</div>
              </div>
              <div className="swiss__counter">{counterVal}%</div>
            </footer>
          </>
        )}

        {/* Concept 4: Synthesis 2.0 */}
        {activeConcept === "synthesis" && (
          <div className="synthesis__panel">
            <div className="synthesis__top-bar">
              <div>01 / INGESTION PHASE</div>
              <div>BUFFER: SYNTHESIS CORE</div>
            </div>
            <div className="synthesis__rail">
              <div className="synthesis__bar" />
              <div className="synthesis__scan" />
            </div>
            <div className="synthesis__title-box">
              <div className="synthesis__title">SYNTHESIS // 2026</div>
            </div>
            <div className="synthesis__meta-row">
              <div>MOSS BLADES // 96,000 BUILT</div>
              <div className="synthesis__percent">{counterVal}%</div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Docked Tweaks Console (实时调参控制台) */}
      <nav className="lab-dock" aria-label="Animation Controls">
        <div className="dock__tabs">
          {CONCEPTS.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setActiveConcept(c.id)}
              className={`dock__tab ${activeConcept === c.id ? "is-active" : ""}`}
            >
              <span>{i + 1}. {c.label}</span>
            </button>
          ))}
        </div>

        <div className="dock__controls">
          <div className="dock__actions">
            <button onClick={playAnimation} className={`dock__btn dock__btn--primary ${isPlaying ? "is-playing" : ""}`}>
              <span>{isPlaying ? "▶ 播放中..." : "⟲ 重播 (Space)"}</span>
            </button>
            <label className="dock__toggle">
              <input
                type="checkbox"
                checked={slowMo}
                onChange={(e) => setSlowMo(e.target.checked)}
              />
              <span>慢动作 (0.25x)</span>
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span>时长:</span>
              {[1.2, 1.6, 2.0, 2.4].map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className="dock__btn"
                  style={{
                    padding: "4px 8px",
                    borderColor: duration === d ? "var(--lab-signal)" : undefined,
                    color: duration === d ? "var(--lab-signal)" : undefined,
                  }}
                >
                  {d}s
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span className="dock__badge">GSAP 3.15 &bull; TIMELINE</span>
            <span>按键 [1-4] 瞬切方案</span>
          </div>
        </div>
      </nav>
    </main>
  );
}