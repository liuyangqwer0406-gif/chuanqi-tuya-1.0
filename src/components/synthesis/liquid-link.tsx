"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  KeyboardEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";
import { TransitionLink } from "./transition-link";
import rawShaderSource from "@/shaders/liquid-metal-button/liquid-metal-button.html?raw";

type LiquidLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: "pill" | "orb";
  ariaLabel?: string;
};

type ShaderMessage = {
  type: "hover" | "move" | "press" | "cancel" | "activity" | "probe";
  value?: boolean;
  x?: number;
  y?: number;
  pointerId?: number;
  pointerType?: string;
  buttons?: number;
};

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const BRIDGE_SCRIPT = `
<script id="liquid-link-bridge">
  (() => {
    const isOrb = document.body.dataset.shape === 'orb';
    const adapterStyle = document.createElement('style');
    adapterStyle.textContent = \`
      html, body {
        width: 100%;
        height: 100%;
        background: transparent !important;
        overflow: hidden;
      }
      body {
        display: grid;
        place-items: center;
      }
      .stage {
        --h: calc(100vh - 2px) !important;
        --bw: calc(100vw - 2px) !important;
        --pad: calc(160 * var(--u)) !important;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
      }
      body[data-shape="orb"] .stage {
        --bw: var(--h) !important;
        --pad: calc(180 * var(--u)) !important;
      }
      .plate {
        background: #08090b !important;
        box-shadow: none !important;
      }
      body[data-shape="orb"] .plate,
      body[data-shape="orb"] .btn {
        border-radius: 50% !important;
      }
      .btn {
        pointer-events: none !important;
      }
      .btn .ico, .btn .lbl {
        display: none !important;
      }
    \`;
    document.head.appendChild(adapterStyle);

    if (typeof window.__set === 'function') {
      window.__set(
        { disp: 0.32, gain: 2.15, dim: 0.28 },
        { base: 0.22, hot: 0.95, chromA: 0.42, chromS: 0.030, speed: 0.065 },
        { glow: 1.95, glowR: 1.25, glowIn: 0.35, soften: 0.22, punch: 1.45 },
        { ptrRad: 0.52, ptrAmp: 0.35, ptrFast: 0.40, ptrRim: 0.85 }
      );
    }

    const reportReady = () => {
      parent.postMessage({ liquidMetalLink: { type: 'ready' } }, '*');
    };

    window.addEventListener('message', event => {
      if (event.source !== parent) return;
      const data = event.data && event.data.liquidMetalLink;
      if (!data) return;

      if (data.type === 'probe') {
        reportReady();
        return;
      }

      if (data.type === 'hover') {
        if (typeof window.__hover === 'function') window.__hover(!!data.value);
        if (data.value && Number.isFinite(data.x) && typeof btn !== 'undefined') {
          const b = btn.getBoundingClientRect();
          const s = Math.max(b.height, 1);
          if (typeof ptr !== 'undefined' && typeof ptrS !== 'undefined') {
            ptr.x = (data.x - b.width / 2) / s;
            ptr.y = (data.y - b.height / 2) / s;
            ptrS.x = ptr.x;
            ptrS.y = ptr.y;
          }
        }
      } else if (data.type === 'move') {
        if (Number.isFinite(data.x) && typeof btn !== 'undefined' && typeof ptr !== 'undefined') {
          const b = btn.getBoundingClientRect();
          const s = Math.max(b.height, 1);
          ptr.x = (data.x - b.width / 2) / s;
          ptr.y = (data.y - b.height / 2) / s;
        }
      } else if (data.type === 'press') {
        if (typeof window.__press === 'function') window.__press(!!data.value);
        if (data.value && Number.isFinite(data.x) && typeof btn !== 'undefined' && typeof window.__ripple === 'function') {
          const b = btn.getBoundingClientRect();
          const s = Math.max(b.height, 1);
          window.__ripple((data.x - b.width / 2) / s, (data.y - b.height / 2) / s);
        }
      } else if (data.type === 'activity') {
        if (typeof running !== 'undefined') {
          running = data.value !== false;
          if (running && typeof frame === 'function') requestAnimationFrame(frame);
        }
      }
    });

    reportReady();
  })();
</script>`;

function buildSource(variant: "pill" | "orb") {
  let src = rawShaderSource;
  if (variant === "orb") {
    src = src.replace("<body>", '<body data-shape="orb">');
  }
  return src.replace("</body>", `${BRIDGE_SCRIPT}\n</body>`);
}

export function LiquidLink({
  href,
  children,
  className = "",
  variant = "pill",
  ariaLabel,
}: LiquidLinkProps) {
  const host = useRef<HTMLAnchorElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const hovered = useRef(false);
  const focused = useRef(false);
  const intersects = useRef(true);
  const active = useRef(false);
  const activityTimer = useRef(0);
  const [ready, setReady] = useState(false);

  const source = useMemo(() => buildSource(variant), [variant]);

  const send = useCallback((message: ShaderMessage) => {
    frame.current?.contentWindow?.postMessage({ liquidMetalLink: message }, "*");
  }, []);

  const syncActivity = useCallback((deferInactive = false) => {
    window.clearTimeout(activityTimer.current);
    const nextActive = !reducedMotion() && intersects.current && document.visibilityState !== "hidden";
    const apply = () => {
      active.current = nextActive;
      send({ type: "activity", value: nextActive });
    };
    if (!nextActive && deferInactive) {
      activityTimer.current = window.setTimeout(apply, 320);
    } else {
      apply();
    }
  }, [send]);

  const pointerData = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      buttons: event.buttons,
    };
  };

  useEffect(() => {
    const anchor = host.current;
    if (!anchor) return;

    const observer = new IntersectionObserver(([entry]) => {
      intersects.current = entry.isIntersecting;
      syncActivity();
    }, { rootMargin: "120px" });
    const onVisibilityChange = () => syncActivity();

    observer.observe(anchor);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearTimeout(activityTimer.current);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [syncActivity]);

  useEffect(() => {
    let probes = 0;
    let probeTimer = 0;
    const receiveReady = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow) return;
      if (event.data?.liquidMetalLink?.type !== "ready") return;
      window.clearInterval(probeTimer);
      setReady(true);
      send({ type: "activity", value: active.current });
    };

    window.addEventListener("message", receiveReady);
    send({ type: "probe" });
    probeTimer = window.setInterval(() => {
      probes += 1;
      send({ type: "probe" });
      if (probes >= 20) window.clearInterval(probeTimer);
    }, 160);
    return () => {
      window.clearInterval(probeTimer);
      window.removeEventListener("message", receiveReady);
    };
  }, [send]);

  const handlePointerEnter = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    hovered.current = event.pointerType === "mouse";
    syncActivity();
    if (!reducedMotion() && event.pointerType === "mouse") {
      send({ type: "hover", value: true, ...pointerData(event) });
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    if (!reducedMotion() && event.pointerType === "mouse") {
      send({ type: "move", ...pointerData(event) });
    }
  };

  const handlePointerLeave = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    hovered.current = false;
    if (!reducedMotion() && !focused.current && event.pointerType === "mouse") {
      send({ type: "hover", value: false });
    }
    syncActivity(true);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    if (reducedMotion()) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    send({ type: "press", value: true, ...pointerData(event) });
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    if (!reducedMotion()) send({ type: "press", value: false, ...pointerData(event) });
  };

  const handlePointerCancel = () => {
    if (!reducedMotion()) {
      send({ type: "cancel" });
      send({ type: "hover", value: false });
    }
  };

  const handleFocus = () => {
    focused.current = true;
    syncActivity();
    if (!reducedMotion()) send({ type: "hover", value: true });
  };

  const handleBlur = () => {
    focused.current = false;
    if (!reducedMotion() && !hovered.current) send({ type: "hover", value: false });
    syncActivity(true);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLAnchorElement>) => {
    if (reducedMotion() || event.repeat || (event.key !== "Enter" && event.key !== " ")) return;
    send({ type: "press", value: true });
  };

  const handleKeyUp = (event: KeyboardEvent<HTMLAnchorElement>) => {
    if (!reducedMotion() && (event.key === "Enter" || event.key === " ")) {
      send({ type: "press", value: false });
    }
  };

  return (
    <TransitionLink
      ref={host}
      href={href}
      className={`liquid-link liquid-link--${variant}${ready ? " is-shader-ready" : ""}${className ? ` ${className}` : ""}`}
      data-state={ready ? "ready" : "loading"}
      aria-label={ariaLabel}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
    >
      <iframe
        key={variant}
        ref={frame}
        className="liquid-link__shader"
        srcDoc={source}
        title=""
        aria-hidden="true"
        tabIndex={-1}
        sandbox="allow-scripts"
        loading="lazy"
        onLoad={() => {
          setReady(true);
          send({ type: "activity", value: active.current });
          if (!reducedMotion() && (hovered.current || focused.current)) {
            send({ type: "hover", value: true });
          }
        }}
      />
      <span className="liquid-link__icon" aria-hidden="true"><i /><i /><i /></span>
      <span className="liquid-link__label">{children}</span>
      <span className="liquid-link__arrow" aria-hidden="true">↗</span>
    </TransitionLink>
  );
}
