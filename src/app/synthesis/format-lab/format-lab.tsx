"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import "./format-lab.css";

type MorphShape = "triangle" | "circle" | "dial" | "frame";
type ActiveChapter = "vertical" | "horizontal" | "circular" | "clickclack";

interface ChapterDef {
  id: ActiveChapter;
  index: string;
  name: string;
  badge: string;
  tip: string;
}

const CHAPTERS: ChapterDef[] = [
  {
    id: "vertical",
    index: "01",
    name: "纵向秩序 (VERTICAL)",
    badge: "9:16 / 3:4",
    tip: "★ 纵向引力：强纵轴聚合、抑制横向逃逸，以单列信息瀑布构建极强视线迫入感。",
  },
  {
    id: "horizontal",
    index: "02",
    name: "宽幕延伸 (HORIZONTAL)",
    badge: "16:9 / 2.39:1",
    tip: "★ 宽幕延伸：匹配人类双眼横向视野，制造稳固、低疲劳的水平叙事推移与电影级沉浸。",
  },
  {
    id: "circular",
    index: "03",
    name: "双轨罗盘 (RADIAL)",
    badge: "1401px DIALS",
    tip: "★ 向心罗盘：打破正交网格惯性，利用左右对偶旋转机械刻度将视线锁在空间奇点。",
  },
  {
    id: "clickclack",
    index: "04",
    name: "节拍试验 (SANDBOX)",
    badge: "CLICK--CLACK",
    tip: "★ 敲击试验：以击打交互感知正负空间、明暗对比与视觉极性瞬间转换。",
  },
];

export function FormatLab() {
  const [activeChapter, setActiveChapter] = useState<ActiveChapter>("vertical");
  const [notesMode, setNotesMode] = useState<boolean>(false);
  const [daughterMode, setDaughterMode] = useState<boolean>(false);
  const [morphShape, setMorphShape] = useState<MorphShape>("triangle");
  const [clickClackState, setClickClackState] = useState<"click" | "clack">("click");
  const [clockTime, setClockTime] = useState<string>("00:00:00");

  const rootRef = useRef<HTMLDivElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);
  const filmstripRef = useRef<HTMLDivElement>(null);
  const travellerRef = useRef<HTMLDivElement>(null);
  const secondBallRef = useRef<SVGCircleElement>(null);
  const minuteBallRef = useRef<SVGCircleElement>(null);
  const hourBallRef = useRef<SVGCircleElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const activeDef = CHAPTERS.find((c) => c.id === activeChapter) || CHAPTERS[0];

  // 1. Filmstrip Stand-in Entrance Sequence (The Obys signature technique)
  const playEntrance = useCallback(() => {
    timelineRef.current?.kill();
    const curtain = curtainRef.current;
    const filmstrip = filmstripRef.current;
    const traveller = travellerRef.current;

    const tl = gsap.timeline();
    timelineRef.current = tl;

    // Reset positions
    if (curtain) gsap.set(curtain, { yPercent: 0, autoAlpha: 1 });
    if (filmstrip) gsap.set(filmstrip, { y: -800, scale: 0.65, autoAlpha: 0 });
    if (traveller) gsap.set(traveller, { scale: 0, rotate: -45, autoAlpha: 0 });

    // Step A: Curtain pulls upward
    if (curtain) {
      tl.to(curtain, {
        yPercent: -100,
        duration: 0.45,
        ease: "expo.inOut",
      });
    }

    // Step B: Filmstrip plunge from stratosphere
    if (filmstrip) {
      tl.to(filmstrip, {
        y: 0,
        scale: 1,
        autoAlpha: 1,
        duration: 0.72,
        ease: "power4.out",
      }, "-=0.2")
      // Step C: Filmstrip dissolves and hands off to live DOM
      .to(filmstrip, {
        autoAlpha: 0,
        duration: 0.35,
        ease: "power2.out",
      }, "+=0.15");
    }

    // Step D: Travelling Morphing Shape springs into view
    if (traveller) {
      tl.to(traveller, {
        scale: 1,
        rotate: 0,
        autoAlpha: 1,
        duration: 0.65,
        ease: "back.out(1.8)",
      }, "-=0.25");
    }
  }, []);

  // Initial playback on mount
  useEffect(() => {
    playEntrance();
    return () => {
      timelineRef.current?.kill();
    };
  }, [playEntrance]);

  // 2. Real-time Clock RAF Loop (Hour, minute, second ball orbital ticks)
  useEffect(() => {
    let frameId: number;

    const updateClock = () => {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      const s = now.getSeconds();
      const ms = now.getMilliseconds();

      const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
      setClockTime(timeStr);

      const secAngle = ((s + ms / 1000) / 60) * 2 * Math.PI - Math.PI / 2;
      const minAngle = ((m + s / 60) / 60) * 2 * Math.PI - Math.PI / 2;
      const hourAngle = (((h % 12) + m / 60) / 12) * 2 * Math.PI - Math.PI / 2;

      // Concentric radii: rSec=42, rMin=30, rHour=18, center=(48, 48)
      if (secondBallRef.current) {
        secondBallRef.current.setAttribute("cx", String(48 + Math.cos(secAngle) * 42));
        secondBallRef.current.setAttribute("cy", String(48 + Math.sin(secAngle) * 42));
      }
      if (minuteBallRef.current) {
        minuteBallRef.current.setAttribute("cx", String(48 + Math.cos(minAngle) * 30));
        minuteBallRef.current.setAttribute("cy", String(48 + Math.sin(minAngle) * 30));
      }
      if (hourBallRef.current) {
        hourBallRef.current.setAttribute("cx", String(48 + Math.cos(hourAngle) * 18));
        hourBallRef.current.setAttribute("cy", String(48 + Math.sin(hourAngle) * 18));
      }

      frameId = requestAnimationFrame(updateClock);
    };

    frameId = requestAnimationFrame(updateClock);
    return () => cancelAnimationFrame(frameId);
  }, []);

  // 3. Travelling Morphing Shape animation on state change
  useEffect(() => {
    const traveller = travellerRef.current;
    if (!traveller) return;

    gsap.fromTo(
      traveller,
      { scale: 0.8, rotate: -25 },
      { scale: 1, rotate: 0, duration: 0.5, ease: "back.out(1.7)", overwrite: "auto" }
    );
  }, [morphShape]);

  // 4. Keyboard Shortcuts: Space (Replay), B (Blueprint), D (Daughter), 1-4 (Chapters)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        playEntrance();
      } else if (e.key === "b" || e.key === "B") {
        setNotesMode((prev) => !prev);
      } else if (e.key === "d" || e.key === "D") {
        setDaughterMode((prev) => !prev);
      } else if (e.key === "1") {
        setActiveChapter("vertical");
        setMorphShape("triangle");
      } else if (e.key === "2") {
        setActiveChapter("horizontal");
        setMorphShape("frame");
      } else if (e.key === "3") {
        setActiveChapter("circular");
        setMorphShape("dial");
      } else if (e.key === "4") {
        setActiveChapter("clickclack");
        setMorphShape("circle");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [playEntrance]);

  // SVG Paths for the 4 morph states
  const renderMorphSvg = () => {
    switch (morphShape) {
      case "triangle":
        return (
          <polygon
            points="70,18 126,118 14,118"
            fill="none"
            stroke="var(--format-signal)"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        );
      case "circle":
        return (
          <circle
            cx="70"
            cy="70"
            r="48"
            fill="none"
            stroke="var(--format-signal)"
            strokeWidth="3"
          />
        );
      case "dial":
        return (
          <g>
            <circle cx="70" cy="70" r="54" fill="none" stroke="var(--format-signal)" strokeWidth="1.5" strokeDasharray="4 4" />
            <circle cx="70" cy="70" r="32" fill="none" stroke="#fff" strokeWidth="2" />
            <circle cx="70" cy="70" r="8" fill="var(--format-signal)" />
            <line x1="70" y1="8" x2="70" y2="24" stroke="var(--format-signal)" strokeWidth="2" />
            <line x1="70" y1="116" x2="70" y2="132" stroke="var(--format-signal)" strokeWidth="2" />
            <line x1="8" y1="70" x2="24" y2="70" stroke="var(--format-signal)" strokeWidth="2" />
            <line x1="116" y1="70" x2="132" y2="70" stroke="var(--format-signal)" strokeWidth="2" />
          </g>
        );
      case "frame":
        return (
          <rect
            x="24"
            y="32"
            width="92"
            height="76"
            fill="none"
            stroke="var(--format-signal)"
            strokeWidth="3"
            rx="2"
          />
        );
    }
  };

  return (
    <div
      ref={rootRef}
      className={`format-lab-root ${notesMode ? "is-notes-mode" : ""} ${daughterMode ? "is-daughter-mode" : ""}`}
    >
      {/* Background Subtle Coordinate Grid */}
      <div className="format-lab-grid" aria-hidden="true" />

      {/* Opening White Curtain (Curtain pull) */}
      <div ref={curtainRef} className="format-curtain" aria-hidden="true" />

      {/* Filmstrip Stand-in Silhouette during entrance */}
      <div ref={filmstripRef} className="format-filmstrip" aria-hidden="true">
        <div className="format-filmstrip__card" style={{ width: 380, height: 480 }} />
        <div className="format-filmstrip__card" style={{ width: 1100, height: 320 }} />
        <div className="format-filmstrip__card" style={{ width: 520, height: 520, borderRadius: "50%" }} />
      </div>

      {/* Travelling Morphing Shape Floating in Viewport */}
      <aside
        ref={travellerRef}
        className="format-traveller"
        aria-label="026 Travelling Morph Shape"
        title="026 全局穿梭变形体"
      >
        <div className="format-traveller__glow" />
        <svg className="format-traveller__svg" viewBox="0 0 140 140">
          {renderMorphSvg()}
        </svg>
      </aside>

      {/* 1. Fixed Architectural Top Header */}
      <header className="format-header">
        <div className="format-header__brand">
          <span className="format-header__logo">
            <span>026 //</span> FORMAT LAB
          </span>
          <span className="format-header__tag">视界画幅与几何引力实验工坊</span>
        </div>

        <div className="format-header__actions">
          {/* Notes / Blueprint Mode Toggle */}
          <button
            type="button"
            className={`format-btn format-btn--blueprint ${notesMode ? "is-active" : ""}`}
            onClick={() => setNotesMode(!notesMode)}
            title="开关工程蓝图与设计手记（快捷键: B）"
          >
            <span>{notesMode ? "✓ 蓝图手记开启" : "☷ 蓝图批注 / NOTES"}</span>
          </button>

          {/* 6 y.o. Daughter Crayon Mode Toggle */}
          <button
            type="button"
            className={`format-btn format-btn--daughter ${daughterMode ? "is-active" : ""}`}
            onClick={() => setDaughterMode(!daughterMode)}
            title="开关六岁女儿童真蜡笔彩蛋（快捷键: D）"
          >
            <span>{daughterMode ? "★ 涂鸦彩蛋开启" : "🖍 涂鸦彩蛋 / DAUGHTER"}</span>
          </button>
        </div>
      </header>

      {/* 2. Giant Architectural FORMAT Monolithic Logo */}
      <section className="format-hero-banner" aria-label="Hero Architectural Logo">
        <svg
          className="format-hero-banner__svg"
          viewBox="0 0 1401 215"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="FORMAT"
        >
          {/* Letter F */}
          <g data-letter="F" fill="#ffffff">
            <path d="M0 46V214H110V0H46L0 46Z" />
            <path d="M226 0H118V80H226V0Z" />
            <path d="M226 88H118V168H226V88Z" />
          </g>
          {/* Letter O */}
          <g data-letter="O" fill="#ffffff">
            <path d="M234 46V168L280 214H344V0H280L234 46Z" />
            <path d="M352 0V214H415L461 168V46L415 0H352Z" />
          </g>
          {/* Letter R */}
          <g data-letter="R" fill="#ffffff">
            <path d="M470 0V214H579V0H470Z" />
            <path d="M587 0V134H696V54L641 0H587Z" />
            <path d="M587 144V215H696L625 144H587Z" />
          </g>
          {/* Letter M */}
          <g data-letter="M" fill="#ffffff">
            <path d="M704 0V214H814V46L767 0H704Z" />
            <path d="M821 46V214H931V0H867L821 46Z" />
          </g>
          {/* Letter A */}
          <g data-letter="A" fill="#ffffff">
            <path d="M939 46V214H1049V0H985L939 46Z" />
            <path d="M1056 0V214H1166V46L1120 0H1056Z" />
          </g>
          {/* Letter T */}
          <g data-letter="T" fill="#ffffff">
            <path d="M1204 0H1174V110H1204V214H1284V0H1204Z" />
            <path d="M1372 0H1292V214H1372V110H1401V46V0H1372Z" />
          </g>
        </svg>

        <div className="format-hero-banner__meta">
          <span>WEN YIFAN 026 // DESIGN EDUCATIONAL SERIES</span>
          <span>RATIO · MARGIN · PERCEPTION · EYE PATHS // 比例、边界与视线轨迹</span>
        </div>
      </section>

      {/* 3. Exhibition Chapters */}
      <main className="format-main">
        {/* =========================================================
            Chapter 01: Vertical Format (9:16 / 3:4)
            ========================================================= */}
        <section className="format-sec-vertical" id="sec-vertical">
          <article className="format-card">
            <div className="format-card__photo">
              {/* Normal Monolith Visual */}
              <div
                className="format-card__img"
                style={{
                  background: "linear-gradient(135deg, #181716 0%, #2e2b26 50%, #0d0d0f 100%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: 20,
                  textAlign: "center",
                }}
              >
                <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.18em", color: "var(--format-signal)" }}>
                  ROKU IKITION // 026
                </span>
                <span style={{ fontSize: "10px", color: "rgba(242, 239, 231, 0.7)", letterSpacing: "0.06em", fontFamily: "var(--font-body-synthesis)" }}>
                  D&AD New Blood · 无酒精植物饮品瓶体网格立柱
                </span>
              </div>

              {/* Daughter Crayon Overlay */}
              <div
                className="format-card__kid-img"
                style={{
                  background: "#fff9eb",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ff3366",
                  fontWeight: 700,
                  fontSize: "13px",
                  letterSpacing: "0.02em",
                  border: "2px dashed #ff3366",
                  padding: 16,
                  textAlign: "center",
                }}
              >
                <span>🖍️ 六岁女儿的视角</span>
                <span style={{ fontSize: "10.5px", color: "#555", marginTop: 6, lineHeight: 1.5, fontWeight: 400 }}>
                  “爸爸总是在电脑上画方块，他说这个长长的瓶子装着山里好闻的树叶，但我觉得它是一座能飞到月亮上的白巧克力火箭！”
                </span>
              </div>
            </div>

            <div className="format-card__header">
              <span className="format-card__index">1</span>
              <span className="format-card__kicker">(Format)</span>
            </div>

            <h2 className="format-card__title">Vertical</h2>
            <div style={{ fontSize: "12px", color: "var(--format-muted)", marginTop: -14, letterSpacing: "0.06em" }}>
              纵向秩序与单列迫视
            </div>

            <div className="format-card__specs">
              <div className="format-spec-row">
                <span className="format-spec-num">1.1</span>
                <span className="format-spec-label">场景</span>
                <div className="format-spec-tags">
                  <span>移动端全屏</span>
                  <span>展览海报</span>
                  <span>包装单体立柱</span>
                </div>
              </div>

              <div className="format-spec-row">
                <span className="format-spec-num">1.2</span>
                <span className="format-spec-label">几何</span>
                <div className="format-spec-tags">
                  <span>3:4 与 9:16</span>
                  <span>垂直基准轴</span>
                  <span>抑制横向逃逸</span>
                </div>
              </div>

              <div className="format-spec-row">
                <span className="format-spec-num">1.3</span>
                <span className="format-spec-label">感知</span>
                <div className="format-spec-tags">
                  <span>单列眼动对焦</span>
                  <span>迫视感</span>
                  <span>重力下沉引力</span>
                </div>
              </div>

              <div className="format-spec-row">
                <span className="format-spec-num">1.4</span>
                <span className="format-spec-label">秩序</span>
                <div className="format-spec-tags">
                  <span>中轴承重</span>
                  <span>黄金分割断点</span>
                  <span>边框自持力</span>
                </div>
              </div>
            </div>

            {/* Blueprint Box (Visible in Notes Mode) */}
            <div className="format-blueprint-box">
              <b>[ 026-ARCHIVE // 现场校准手记 SPEC.V-01 ]</b>
              <div>• 尺寸裁切：380 × 560 pt · 比例 1:1.47 · 视线滞留点 Y: 41.8%</div>
              <div>• 对比度：19.4:1（纯白哑光卡纸置于黑曜炭底）</div>
              <div>• 设计手记：“窄边距迫使视线放弃横向漫游，以线性坠落的方式自上而下审读。当版面失去两侧横向回旋余地时，信息密度的权重直接转移至字间距与留白。”</div>
            </div>
          </article>

          {/* Right Column: Physical Clock & Theory Quote */}
          <div className="format-sec-vertical__right">
            <div className="format-clock-panel">
              <div className="format-clock-widget">
                <svg className="format-clock-svg" viewBox="0 0 96 96">
                  {/* Dial ticks */}
                  <circle cx="48" cy="48" r="46" fill="none" stroke="rgba(242, 239, 231, 0.12)" strokeWidth="1" />
                  <circle cx="48" cy="48" r="42" fill="none" stroke="rgba(242, 239, 231, 0.08)" strokeWidth="1" strokeDasharray="2 6" />
                  <circle cx="48" cy="48" r="30" fill="none" stroke="rgba(242, 239, 231, 0.08)" strokeWidth="1" />
                  <circle cx="48" cy="48" r="18" fill="none" stroke="rgba(242, 239, 231, 0.08)" strokeWidth="1" />

                  {/* 3 Physical Orbital Balls: Second, Minute, Hour */}
                  <circle ref={secondBallRef} cx="48" cy="6" r="3" fill="var(--format-signal)" />
                  <circle ref={minuteBallRef} cx="48" cy="18" r="4" fill="#ffffff" />
                  <circle ref={hourBallRef} cx="48" cy="30" r="5.5" fill="#999999" />
                </svg>
              </div>

              <div className="format-clock-meta">
                <span className="format-clock-title">026 物理硬件走时传感器 / HARDWARE TICKER</span>
                <span className="format-clock-time">{clockTime}</span>
                <span className="format-clock-desc">
                  基于 requestAnimationFrame 抓取您本地硬件真实时间。秒、分、时三轨钢球按物理角速度行进，秒球每秒划过 30°。版面不只是静止的招贴，它在与物理世界同步衰老与流逝。
                </span>
              </div>
            </div>

            <div className="format-quote-block">
              <p className="format-quote-text">
                "A BORDER DOES NOT CONTAIN THE WORK; IT GIVES THE EYE A PLACE TO PUSH AGAINST."
              </p>
              <div style={{ fontSize: "13px", color: "#f2efe7", marginTop: 4, fontFamily: "var(--font-body-synthesis)" }}>
                “画幅绝非被动盛放内容的容器，而是为视线提供对抗支点的无形引力场。”
              </div>
              <span className="format-quote-author" style={{ marginTop: 8 }}>
                — 温一帆 / 026 视觉工作笔记 · 杭州
              </span>
            </div>
          </div>
        </section>

        {/* =========================================================
            Chapter 02: Horizontal Format (16:9 / 2.39:1)
            ========================================================= */}
        <section className="format-sec-horizontal" id="sec-horizontal">
          <div className="format-wide-card">
            <div>
              <div style={{ display: "flex", gap: 16, alignItems: "baseline", marginBottom: 16 }}>
                <span style={{ fontSize: 24, fontWeight: 300 }}>(2)</span>
                <span style={{ fontSize: 11, letterSpacing: "0.14em", color: "var(--format-muted)" }}>[RATIO 2.39:1 CINEMATIC ANAMORPHIC]</span>
              </div>
              <h2 className="format-wide-card__title">Horizontal</h2>
              <div style={{ fontSize: "13px", color: "var(--format-muted)", marginTop: -8, letterSpacing: "0.06em" }}>
                视平线延伸与电影级沉浸
              </div>

              <div className="format-wide-card__marquee">
                <div className="format-wide-card__track">
                  <span>DESKTOP CINEMA</span>
                  <span>·</span>
                  <span>桌面展陈</span>
                  <span>·</span>
                  <span>宽幅三维场景</span>
                  <span>·</span>
                  <span>92° 视平线游移</span>
                  <span>·</span>
                  <span>沉浸式包装展开图</span>
                  <span>·</span>
                  <span>DESKTOP CINEMA</span>
                  <span>·</span>
                  <span>桌面展陈</span>
                  <span>·</span>
                  <span>宽幅三维场景</span>
                  <span>·</span>
                  <span>92° 视平线游移</span>
                  <span>·</span>
                  <span>沉浸式包装展开图</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14, fontSize: 11 }}>
              <div><b>2.1 视野尺度：</b> 匹配人类双眼自然横向视角 92°，眼动横向扫掠疲劳度比纵向低 62%</div>
              <div><b>2.2 视觉重力：</b> 下压式地平线，构图具备天然扎根地面的厚重感与稳定度</div>
              <div><b>2.3 连续叙事：</b> 时间轴自左向右线性铺展，适合多维参数与工艺图解</div>
              {notesMode && (
                <div className="format-blueprint-box">
                  <b>[ 026-ARCHIVE // 横轴视平线校准 ]</b>
                  <div>• 宽幅画卷的核心是制造“流经感”，两翼不应锁死，留出视线溢出边框的气孔。</div>
                  <div>• 横向视线移动速度：0.18s / 1000px</div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* =========================================================
            Chapter 03: Dual Radial Symmetrical Dials
            ========================================================= */}
        <section className="format-sec-dials" id="sec-circular">
          <div className="format-dial format-dial--left">
            <div className="format-dial__core" />
          </div>

          <div className="format-dial format-dial--right">
            <div className="format-dial__core" />
          </div>

          <div className="format-sec-dials__center">
            <span className="format-sec-dials__tag">RADIAL GRAVITY & COMPASS // 1401PX 向心罗盘</span>
            <h2 className="format-sec-dials__title">Circular & Concentric Gravity</h2>
            <div style={{ fontSize: "14px", color: "var(--format-signal)", fontWeight: 500, letterSpacing: "0.08em" }}>
              环形引力与向心罗盘
            </div>
            <p className="format-sec-dials__desc">
              将视线绝对锚定于几何奇点。左右两侧对称排布的 1400px 半藏式刻度环，按 7.5° 等分角逆向缓动旋转，用机械仪表的精密冷感打破正交直线网格的单一惯性。
            </p>
          </div>
        </section>

        {/* =========================================================
            Chapter 04: Click--Clack Rhythm Sandbox
            ========================================================= */}
        <section
          className="format-sec-clickclack"
          id="sec-clickclack"
          onClick={() => setClickClackState(clickClackState === "click" ? "clack" : "click")}
        >
          <div className="format-clickclack__status">
            <span>[ 交互式节拍沙盒 / RHYTHMIC EXPERIMENT ]</span>
            <span>点击任意区域翻转极性：当前激活 → [ {clickClackState === "click" ? "CLICK 明相 / 显影" : "CLACK 暗相 / 留白"} ]</span>
          </div>

          <div className="format-clickclack__word-grid">
            <div className={`format-clickclack__block ${clickClackState === "click" ? "is-active" : ""}`}>
              <h3 className="format-clickclack__heading">CLICK</h3>
              <span className="format-clickclack__desc" style={{ fontWeight: 600 }}>明相 / 显影 (LIGHT PHASE)</span>
              <span style={{ fontSize: "10px", color: clickClackState === "click" ? "#fff" : "var(--format-muted)", marginTop: 4 }}>
                高频快门 · 墨迹实存 · 视觉重量 98.4% · 强信息注入
              </span>
            </div>

            <div className={`format-clickclack__block ${clickClackState === "clack" ? "is-active" : ""}`}>
              <h3 className="format-clickclack__heading">CLACK</h3>
              <span className="format-clickclack__desc" style={{ fontWeight: 600 }}>暗相 / 留白 (DARK PHASE)</span>
              <span style={{ fontSize: "10px", color: clickClackState === "clack" ? "#fff" : "var(--format-muted)", marginTop: 4 }}>
                低频深空 · 负空间释放 · 呼吸间歇 · 结构重置
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* 4. Bottom Docked Format Calibration Director Console */}
      <nav className="format-dock" aria-label="Format Calibration Director">
        <div className="format-dock__tabs">
          {CHAPTERS.map((ch) => (
            <button
              key={ch.id}
              type="button"
              className={`format-dock__tab ${activeChapter === ch.id ? "is-active" : ""}`}
              onClick={() => {
                setActiveChapter(ch.id);
                if (ch.id === "vertical") setMorphShape("triangle");
                else if (ch.id === "horizontal") setMorphShape("frame");
                else if (ch.id === "circular") setMorphShape("dial");
                else if (ch.id === "clickclack") setMorphShape("circle");
              }}
            >
              <span className="format-dock__tab-num">[{ch.index}] {ch.badge}</span>
              <span className="format-dock__tab-title">{ch.name}</span>
            </button>
          ))}
        </div>

        <div className="format-dock__controls">
          <div className="format-dock__actions">
            {/* Replay Entrance button */}
            <button
              type="button"
              className="format-dock__replay-btn"
              onClick={playEntrance}
              title="重播胶片俯冲入场 (快捷键: Space)"
            >
              <span>⟲ 胶片俯冲入场</span>
            </button>

            {/* Shape Morphing Pills */}
            <div className="format-dock__morph-pills" title="手动形变中央几何穿梭体">
              <button
                type="button"
                className={`format-dock__morph-pill ${morphShape === "triangle" ? "is-active" : ""}`}
                onClick={() => setMorphShape("triangle")}
              >
                ▲ 三角
              </button>
              <button
                type="button"
                className={`format-dock__morph-pill ${morphShape === "circle" ? "is-active" : ""}`}
                onClick={() => setMorphShape("circle")}
              >
                ● 粒子
              </button>
              <button
                type="button"
                className={`format-dock__morph-pill ${morphShape === "dial" ? "is-active" : ""}`}
                onClick={() => setMorphShape("dial")}
              >
                ◎ 仪表
              </button>
              <button
                type="button"
                className={`format-dock__morph-pill ${morphShape === "frame" ? "is-active" : ""}`}
                onClick={() => setMorphShape("frame")}
              >
                ■ 矩形
              </button>
            </div>
          </div>

          <div className="format-dock__tip">
            {activeDef.tip}
          </div>
        </div>
      </nav>
    </div>
  );
}
