"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { ProjectImage } from "@/data/synthesis-projects";
import styles from "./interaction-controls.module.css";

// Interaction reference: 21st.dev / ibrandify / Thumbnail image viewer.
export function GalleryThumbnailStrip({ images, active, onSelect }: {
  images: ProjectImage[];
  active: number;
  onSelect: (image: ProjectImage) => void;
}) {
  const strip = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = strip.current;
    const item = list?.children[active] as HTMLElement | undefined;
    if (!list || !item) return;
    const left = item.offsetLeft;
    if (left < list.scrollLeft || left + item.offsetWidth > list.scrollLeft + list.clientWidth) {
      list.scrollTo({ left: Math.max(0, left - (list.clientWidth - item.offsetWidth) / 2), behavior: "instant" });
    }
  }, [active]);

  return (
    <div ref={strip} className={styles.thumbnails} role="group" aria-label="选择项目图片"
      onClick={event => event.stopPropagation()}
      onKeyDown={event => {
        let next = active;
        if (event.key === "ArrowRight") next = (active + 1) % images.length;
        else if (event.key === "ArrowLeft") next = (active - 1 + images.length) % images.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = images.length - 1;
        else return;
        event.preventDefault();
        event.stopPropagation();
        onSelect(images[next]);
        (strip.current?.children[next] as HTMLButtonElement)?.focus({ preventScroll: true });
      }}>
      {images.map((item, index) => (
        <button key={`${item.src}-${index}`} type="button" aria-label={`查看第 ${index + 1} 张：${item.caption}`}
          aria-pressed={active === index} tabIndex={active === index ? 0 : -1} onClick={() => onSelect(item)}>
          <Image src={item.src} alt="" fill sizes="92px" />
          <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
        </button>
      ))}
    </div>
  );
}
