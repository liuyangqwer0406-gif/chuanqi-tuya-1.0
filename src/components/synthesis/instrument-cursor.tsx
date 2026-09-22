"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

type CursorMode = "default" | "interactive" | "media" | "mail" | "select" | "native";

function readCursorMode(target: EventTarget | null): { mode: CursorMode; label: string } {
  if (!(target instanceof Element)) return { mode: "default", label: "" };
  if (target.closest(":disabled, [aria-disabled='true']")) return { mode: "native", label: "" };
  if (target.matches(".sylva-living-world-scene iframe")) return { mode: "default", label: "" };
  if (target.closest("iframe, input, textarea, select, [contenteditable='true'], [data-native-cursor]")) {
    return { mode: "native", label: "" };
  }
  if (target.closest(".case-figure button, [data-lightbox-src], button[data-lightbox]")) {
    return { mode: "media", label: "VIEW" };
  }
  if (target.closest(".synthesis-work__index button")) return { mode: "select", label: "SELECT" };
  if (target.closest("a[href^='mailto:']")) return { mode: "mail", label: "MAIL" };
  if (target.closest("a, button, summary, [role='button']")) return { mode: "interactive", label: "" };
  return { mode: "default", label: "" };
}

export function InstrumentCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const cursor = cursorRef.current;
    const label = labelRef.current;
    if (!cursor || !label) return;

    const root = document.documentElement;
    const precisePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let enabled = precisePointer.matches;
    let pointer: { x: number; y: number } | null = null;
    const pointerOffset = cursor.getBoundingClientRect().width / 2;
    const moveX = gsap.quickTo(cursor, "x", { duration: 0.14, ease: "power3.out", overwrite: "auto" });
    const moveY = gsap.quickTo(cursor, "y", { duration: 0.14, ease: "power3.out", overwrite: "auto" });

    gsap.set(cursor, { x: -80, y: -80 });

    const hide = () => cursor.classList.remove("is-visible", "is-pressed");
    const setMode = (target: EventTarget | null) => {
      const next = readCursorMode(target);
      cursor.dataset.mode = next.mode;
      label.textContent = next.label;
      cursor.classList.toggle("is-interactive", next.mode === "interactive");
      cursor.classList.toggle("is-media", next.mode === "media");
      cursor.classList.toggle("is-mail", next.mode === "mail");
      cursor.classList.toggle("is-select", next.mode === "select");
      cursor.classList.toggle("is-native", next.mode === "native");
      if (next.mode === "native") hide();
    };
    const syncCapability = () => {
      enabled = precisePointer.matches;
      root.classList.toggle("has-syn-instrument-cursor", enabled);
      if (!enabled) hide();
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!enabled || event.pointerType !== "mouse") return;
      pointer = { x: event.clientX, y: event.clientY };
      moveX(event.clientX - pointerOffset);
      moveY(event.clientY - pointerOffset);
      setMode(event.target);
      if (cursor.dataset.mode !== "native") cursor.classList.add("is-visible");
    };
    const onScenePointer = (event: Event) => {
      if (!enabled) return;
      const detail = (event as CustomEvent<{ type: string; x: number; y: number; button: number }>).detail;
      if (detail.type === "hide") { pointer = null; hide(); return; }
      if (detail.type === "mouseleave") {
        if (detail.x <= 0 || detail.y <= 0 || detail.x >= innerWidth || detail.y >= innerHeight) { pointer = null; hide(); }
        else if (pointer) {
          setMode(document.elementFromPoint(detail.x, detail.y));
          if (cursor.dataset.mode !== "native") cursor.classList.add("is-visible");
        }
        return;
      }
      if (detail.type === "pointermove" || detail.type === "pointerdown") {
        pointer = { x: detail.x, y: detail.y };
        moveX(detail.x - pointerOffset);
        moveY(detail.y - pointerOffset);
        setMode(null);
        cursor.classList.add("is-visible");
      }
      if (detail.type === "pointerdown" && detail.button === 0) cursor.classList.add("is-pressed");
      if (detail.type === "pointerup" || detail.type === "pointercancel") cursor.classList.remove("is-pressed");
    };
    const onPointerDown = (event: PointerEvent) => {
      if (enabled && event.pointerType === "mouse" && event.button === 0 && cursor.dataset.mode !== "native") {
        cursor.classList.add("is-pressed");
      }
    };
    const onPointerUp = () => cursor.classList.remove("is-pressed");
    const onScroll = () => {
      if (enabled && pointer) setMode(document.elementFromPoint(pointer.x, pointer.y));
    };
    const onKeyDown = () => { pointer = null; hide(); };
    const onVisibilityChange = () => {
      if (document.hidden) hide();
    };

    syncCapability();
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerUp, { passive: true });
    window.addEventListener("synthesis:scene-pointer", onScenePointer);
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("blur", hide);
    document.addEventListener("mouseleave", hide);
    document.addEventListener("visibilitychange", onVisibilityChange);
    precisePointer.addEventListener("change", syncCapability);

    return () => {
      gsap.killTweensOf(cursor);
      root.classList.remove("has-syn-instrument-cursor");
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("synthesis:scene-pointer", onScenePointer);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("blur", hide);
      document.removeEventListener("mouseleave", hide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      precisePointer.removeEventListener("change", syncCapability);
    };
  }, { scope: cursorRef });

  return (
    <div ref={cursorRef} className="syn-instrument-cursor" data-mode="default" aria-hidden="true">
      <span className="syn-instrument-cursor__frame" />
      <span className="syn-instrument-cursor__core" />
      <span ref={labelRef} className="syn-instrument-cursor__label" />
    </div>
  );
}
