"use client";

import { useEffect, useState, useRef } from "react";

export type MotionPresetId = "cinematic" | "apple" | "fluid" | "native";

export interface MotionSettings {
  preset: MotionPresetId;
  lerp: number;
  duration: number;
  wheelMultiplier: number;
  revealEnabled: boolean;
}

export const DEFAULT_MOTION_SETTINGS: MotionSettings = {
  preset: "cinematic",
  lerp: 0.075,
  duration: 1.3,
  wheelMultiplier: 1.0,
  revealEnabled: true,
};

export const MOTION_PRESETS: Record<
  MotionPresetId,
  { name: string; sub: string; lerp: number; duration: number; multiplier: number }
> = {
  cinematic: {
    name: "CINEMATIC SILK",
    sub: "0.075 LERP · FLOATING",
    lerp: 0.075,
    duration: 1.3,
    multiplier: 1.0,
  },
  apple: {
    name: "APPLE DAMPED",
    sub: "0.120 LERP · SPRING",
    lerp: 0.12,
    duration: 1.0,
    multiplier: 1.0,
  },
  fluid: {
    name: "FLUID MOMENTUM",
    sub: "0.180 LERP · SNAPPY",
    lerp: 0.18,
    duration: 0.7,
    multiplier: 1.15,
  },
  native: {
    name: "NATIVE SCROLL",
    sub: "RAW BROWSER ENGINE",
    lerp: 1.0,
    duration: 0.01,
    multiplier: 1.0,
  },
};

interface TweaksPanelProps {
  settings: MotionSettings;
  onChange: (newSettings: MotionSettings) => void;
  fps: number;
  velocity: number;
  scrollPercent: number;
}

export function TweaksPanel({
  settings,
  onChange,
  fps,
  velocity,
  scrollPercent,
}: TweaksPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut ~ or \ to toggle
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) return;

      if (e.key === "`" || e.key === "~" || e.key === "\\") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const handlePresetSelect = (id: MotionPresetId) => {
    const p = MOTION_PRESETS[id];
    onChange({
      ...settings,
      preset: id,
      lerp: p.lerp,
      duration: p.duration,
      wheelMultiplier: p.multiplier,
    });
  };

  const handleLerpChange = (value: number) => {
    onChange({
      ...settings,
      preset: "cinematic", // custom
      lerp: value,
    });
  };

  const handleMultiplierChange = (value: number) => {
    onChange({
      ...settings,
      wheelMultiplier: value,
    });
  };

  const handleToggleReveal = () => {
    onChange({
      ...settings,
      revealEnabled: !settings.revealEnabled,
    });
  };

  const handleReset = () => {
    onChange(DEFAULT_MOTION_SETTINGS);
  };

  const currentPreset = MOTION_PRESETS[settings.preset];
  const activeLabel = currentPreset ? currentPreset.name.split(" ")[0] : "CUSTOM";

  return (
    <aside className="motion-tweaks-root" aria-label="Motion Calibration Console" ref={panelRef}>
      {!isOpen ? (
        <button
          type="button"
          className="motion-tweaks-pill"
          onClick={() => setIsOpen(true)}
          title="Open Motion Dynamics Console (Press ~)"
        >
          <span className="motion-tweaks-pip" aria-hidden="true" />
          <span className="motion-tweaks-pill-index">026 /</span>
          <span className="motion-tweaks-pill-label">MOTION LAB</span>
          <span className="motion-tweaks-pill-active">{activeLabel}</span>
        </button>
      ) : (
        <div
          className="motion-tweaks-card"
          role="dialog"
          aria-modal="false"
          aria-label="Motion Dynamics Controller"
        >
          {/* Header */}
          <div className="motion-tweaks-header">
            <div className="motion-tweaks-header-meta">
              <span className="motion-tweaks-kicker">
                <span className="motion-tweaks-pip" aria-hidden="true" />
                <span>026 // CALIBRATION CONSOLE</span>
              </span>
              <h3 className="motion-tweaks-h1">MOTION DYNAMICS</h3>
            </div>
            <button
              type="button"
              className="motion-tweaks-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close calibration console"
            >
              ESC [ ✕ ]
            </button>
          </div>

          {/* Section 01: Presets */}
          <div>
            <div className="motion-tweaks-section-head">
              <span>01 / EASING PRESET</span>
              <span>动效模式</span>
            </div>
            <div className="motion-tweaks-presets-list">
              {(Object.keys(MOTION_PRESETS) as MotionPresetId[]).map((id, index) => {
                const item = MOTION_PRESETS[id];
                const active = settings.preset === id;
                return (
                  <button
                    key={id}
                    type="button"
                    className={`motion-tweaks-preset-row ${active ? "is-active" : ""}`}
                    onClick={() => handlePresetSelect(id)}
                  >
                    <div className="motion-tweaks-preset-info">
                      <span className="motion-tweaks-preset-num">[{String(index + 1).padStart(2, "0")}]</span>
                      <span className="motion-tweaks-preset-title">{item.name}</span>
                    </div>
                    <span className="motion-tweaks-preset-param">{item.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 02: Calibration Sliders */}
          <div className="motion-tweaks-calibration">
            <div className="motion-tweaks-section-head">
              <span>02 / DAMPING PHYSICS</span>
              <span>阻尼参数</span>
            </div>

            <div className="motion-tweaks-dial">
              <div className="motion-tweaks-dial-meta">
                <span className="motion-tweaks-dial-label">LERP DAMPING / 缓动阻尼</span>
                <span className="motion-tweaks-dial-readout">{settings.lerp.toFixed(3)}</span>
              </div>
              <div className="motion-tweaks-slider-track">
                <input
                  type="range"
                  className="motion-tweaks-range"
                  min="0.02"
                  max="0.25"
                  step="0.005"
                  value={settings.lerp}
                  onChange={(e) => handleLerpChange(parseFloat(e.target.value))}
                  aria-label="Lerp damping factor"
                />
              </div>
            </div>

            <div className="motion-tweaks-dial">
              <div className="motion-tweaks-dial-meta">
                <span className="motion-tweaks-dial-label">WHEEL SENSITIVITY / 滚轮灵敏度</span>
                <span className="motion-tweaks-dial-readout">{settings.wheelMultiplier.toFixed(2)}x</span>
              </div>
              <div className="motion-tweaks-slider-track">
                <input
                  type="range"
                  className="motion-tweaks-range"
                  min="0.5"
                  max="2.0"
                  step="0.05"
                  value={settings.wheelMultiplier}
                  onChange={(e) => handleMultiplierChange(parseFloat(e.target.value))}
                  aria-label="Wheel sensitivity multiplier"
                />
              </div>
            </div>
          </div>

          {/* Section 03: Scroll Reveal Switch */}
          <div className="motion-tweaks-switch-container">
            <div className="motion-tweaks-switch-text">
              <span className="motion-tweaks-switch-title">SCROLL REVEAL</span>
              <span className="motion-tweaks-switch-desc">视口淡入呼吸微动效</span>
            </div>
            <button
              type="button"
              className={`motion-tweaks-state-pill ${settings.revealEnabled ? "is-active" : ""}`}
              onClick={handleToggleReveal}
              aria-label="Toggle scroll reveal animation"
            >
              <span className="motion-tweaks-state-pip" aria-hidden="true" />
              <span>{settings.revealEnabled ? "ACTIVE" : "BYPASS"}</span>
            </button>
          </div>

          {/* Section 04: Telemetry Grid */}
          <div>
            <div className="motion-tweaks-section-head">
              <span>03 / TELEMETRY</span>
              <span>实时监测</span>
            </div>
            <div className="motion-tweaks-telemetry-grid">
              <div className="motion-tweaks-telemetry-cell">
                <span className="motion-tweaks-telemetry-label">RATE</span>
                <span className="motion-tweaks-telemetry-value">{fps} FPS</span>
              </div>
              <div className="motion-tweaks-telemetry-cell">
                <span className="motion-tweaks-telemetry-label">VELOCITY</span>
                <span className="motion-tweaks-telemetry-value">{Math.round(velocity)} PX/S</span>
              </div>
              <div className="motion-tweaks-telemetry-cell">
                <span className="motion-tweaks-telemetry-label">SCROLL</span>
                <span className="motion-tweaks-telemetry-value">{Math.round(scrollPercent)} %</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="motion-tweaks-footer">
            <span>KEY SHORTCUT [ ~ ]</span>
            <button type="button" className="motion-tweaks-reset-btn" onClick={handleReset}>
              [ RESET CALIBRATION ]
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
