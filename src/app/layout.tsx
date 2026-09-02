import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wen Yifan - Visual Design Portfolio",
  description: "温一帆的视觉设计作品集，涵盖品牌、包装、三维影像与交互体验。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
