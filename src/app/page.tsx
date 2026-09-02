import type { Metadata } from "next";
import { SynthesisShell } from "@/components/synthesis/synthesis-shell";
import { SynthesisHome } from "@/components/synthesis/synthesis-home";
import "./synthesis/synthesis.css";

export const metadata: Metadata = {
  title: "Wen Yifan - Visual Design Portfolio",
  description: "Selected work in brand identity, packaging, 3D image and interactive experience by Wen Yifan.",
};

export default function Home() {
  return (
    <SynthesisShell>
      <SynthesisHome />
    </SynthesisShell>
  );
}
