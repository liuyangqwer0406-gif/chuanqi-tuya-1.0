"use client";

import type { ImageLoaderProps } from "next/image";

// These files are produced before dev/build, so static hosts need no image server.
export default function portfolioImageLoader({ src, width }: ImageLoaderProps) {
  if (!src.startsWith("/") || !src.includes("/portfolio-assets/") || !/\.(png|jpe?g|webp)$/i.test(src)) return src;
  return `${src.replace("/portfolio-assets/", "/portfolio-optimized/")}-${width}.webp`;
}
