import type { Metadata } from "next";
import { SynthesisHome } from "@/components/synthesis/synthesis-home";
import "./synthesis/synthesis.css";
import "./synthesis/motion-refinement.css";
import "./synthesis/evolution-motion.css";
import "./synthesis/case-refinement.css";

export const metadata: Metadata = {
  title: "Wen Yifan - Visual Design Portfolio",
  description: "Selected work in brand identity, packaging, 3D image and interactive experience by Wen Yifan.",
};

export default function Home() {
  return (
    <SynthesisHome />
  );
}
