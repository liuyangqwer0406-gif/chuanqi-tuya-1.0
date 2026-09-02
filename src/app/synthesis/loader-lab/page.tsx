import type { Metadata } from "next";
import { LoaderLab } from "./loader-lab";

export const metadata: Metadata = {
  title: "Loader Motion Lab — Wen Yifan",
  description: "Interactive GSAP Preloader Choreography Studio for Wen Yifan Visual Design Portfolio.",
};

export default function LoaderLabPage() {
  return <LoaderLab />;
}