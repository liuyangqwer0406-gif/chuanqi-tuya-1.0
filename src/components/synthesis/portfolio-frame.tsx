"use client";

import { usePathname } from "next/navigation";
import { SynthesisShell } from "./synthesis-shell";
import { normalizeRoutePath } from "./route-events";

export function PortfolioFrame({ children }: { children: React.ReactNode }) {
  const path = normalizeRoutePath(usePathname());
  return path === "/" || path === "/synthesis" || path.startsWith("/synthesis/")
    ? <SynthesisShell>{children}</SynthesisShell>
    : children;
}
