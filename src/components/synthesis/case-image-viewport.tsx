"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import type { ProjectImage } from "@/data/synthesis-projects";
import styles from "./interaction-controls.module.css";

// Click-to-zoom and full-resolution source inspired by 21st / inference-sh / Zoomable Image.
export function CaseImageViewport({ image, onStep, onImageReady }: { image: ProjectImage; onStep: (direction: number) => void; onImageReady?: (image: HTMLImageElement) => void }) {
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const moved = useRef(false);
  const [zoomed, setZoomed] = useState(false);

  useLayoutEffect(() => {
    const area = viewport.current;
    if (!area) return;
    area.scrollLeft = (area.scrollWidth - area.clientWidth) / 2;
    area.scrollTop = (area.scrollHeight - area.clientHeight) / 2;
  }, [zoomed]);

  return (
    <div className={`case-lightbox__media ${styles.imageMedia}`} onClick={event => event.stopPropagation()}>
      <div ref={viewport} className={styles.imageViewport} data-zoomed={zoomed} data-lenis-prevent>
        <button
          type="button"
          className={styles.imageSurface}
          data-native-cursor
          aria-label={zoomed ? "适应窗口，图片当前已放大" : "放大图片查看细节"}
          aria-pressed={zoomed}
          aria-keyshortcuts="+ - 0"
          onKeyDown={event => {
            if (!["+", "=", "-", "0"].includes(event.key)) return;
            event.preventDefault();
            setZoomed(event.key === "+" || event.key === "=");
          }}
          onClick={() => {
            if (moved.current) { moved.current = false; return; }
            setZoomed(current => !current);
          }}
          onDragStart={event => event.preventDefault()}
          onPointerDown={event => {
            if (event.button !== 0 || !viewport.current) return;
            moved.current = false;
            drag.current = { x: event.clientX, y: event.clientY, left: viewport.current.scrollLeft, top: viewport.current.scrollTop };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={event => {
            const start = drag.current;
            const area = viewport.current;
            if (!start || !area) return;
            const dx = event.clientX - start.x;
            const dy = event.clientY - start.y;
            if (Math.hypot(dx, dy) > 6) moved.current = true;
            if (zoomed && moved.current) {
              area.scrollLeft = start.left - dx;
              area.scrollTop = start.top - dy;
              event.currentTarget.dataset.dragging = "true";
            }
          }}
          onPointerUp={event => {
            const start = drag.current;
            drag.current = null;
            delete event.currentTarget.dataset.dragging;
            if (!start || zoomed || event.pointerType !== "touch") return;
            const dx = event.clientX - start.x;
            const dy = event.clientY - start.y;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) onStep(dx < 0 ? 1 : -1);
          }}
          onPointerCancel={event => {
            drag.current = null;
            moved.current = true;
            delete event.currentTarget.dataset.dragging;
          }}
        >
          <Image src={image.src} alt={image.alt} fill sizes="96vw" unoptimized={zoomed} draggable={false} onLoad={event => onImageReady?.(event.currentTarget)} />
        </button>
      </div>
      <button className={styles.zoomControl} type="button" aria-pressed={zoomed} onClick={() => setZoomed(current => !current)}>
        {zoomed ? "FIT / 适应窗口" : "2× / 放大细节"}
      </button>
      {zoomed && <span className={styles.zoomHint} aria-live="polite">拖动查看 · 点击还原</span>}
    </div>
  );
}
