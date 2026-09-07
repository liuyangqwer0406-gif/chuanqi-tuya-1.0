import type { Metadata } from "next";
import { FormatLab } from "./format-lab";

export const metadata: Metadata = {
  title: "026 FORMAT LAB — Architectural Editorial & Travelling Geometry Engine",
  description: "Interactive experiment exploring format, proportion and travelling geometry inspired by Obys x DES FORMAT and Wen Yifan 026 Archive.",
};

export default function FormatLabPage() {
  return <FormatLab />;
}
