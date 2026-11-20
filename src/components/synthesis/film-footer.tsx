"use client";

import Image from "next/image";
import { ArrowDownToLine, ArrowUpRight, Check, Copy, Mail } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { assetPath } from "@/lib/assets";
import { TransitionLink } from "./transition-link";
import styles from "./film-footer.module.css";
import { FooterDissolve } from "./footer-dissolve";

const EMAIL = "2742733283@qq.com";

export function FilmFooter({ isHome }: { isHome: boolean }) {
  const footerRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [copyStatus, setCopyStatus] = useState("");
  const copyBusy = useRef(false);
  const copied = copyStatus === "邮箱已复制";

  useEffect(() => {
    const footer = footerRef.current;
    const image = imageRef.current;
    if (!footer || !image) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let bounds = footer.getBoundingClientRect();
    let frame: number | null = null;
    let visible = false;
    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;

    const stop = () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = null;
      x = y = targetX = targetY = 0;
      image.style.removeProperty("transform");
    };

    const draw = () => {
      frame = null;
      if (!visible || document.hidden || reducedMotion.matches || !finePointer.matches) {
        stop();
        return;
      }

      x += (targetX - x) * 0.12;
      y += (targetY - y) * 0.12;
      image.style.transform = `translate3d(${x.toFixed(3)}px, ${y.toFixed(3)}px, 0) scale(1.018)`;
      if (Math.abs(targetX - x) + Math.abs(targetY - y) > 0.01) frame = window.requestAnimationFrame(draw);
    };

    const schedule = () => {
      if (frame === null) frame = window.requestAnimationFrame(draw);
    };

    const updateBounds = () => { if (visible) bounds = footer.getBoundingClientRect(); };
    const onPointerMove = (event: PointerEvent) => {
      if (!finePointer.matches || reducedMotion.matches || !visible || document.hidden) return;
      targetX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 12;
      targetY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 8;
      schedule();
    };
    const onPointerLeave = () => {
      targetX = targetY = 0;
      if (!reducedMotion.matches) schedule();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) updateBounds();
      else stop();
    });

    footer.addEventListener("pointerenter", updateBounds);
    footer.addEventListener("pointermove", onPointerMove);
    footer.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("resize", updateBounds, { passive: true });
    window.addEventListener("scroll", updateBounds, { passive: true });
    document.addEventListener("visibilitychange", stop);
    reducedMotion.addEventListener("change", stop);
    finePointer.addEventListener("change", stop);
    observer.observe(footer);

    return () => {
      footer.removeEventListener("pointerenter", updateBounds);
      footer.removeEventListener("pointermove", onPointerMove);
      footer.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("resize", updateBounds);
      window.removeEventListener("scroll", updateBounds);
      document.removeEventListener("visibilitychange", stop);
      reducedMotion.removeEventListener("change", stop);
      finePointer.removeEventListener("change", stop);
      observer.disconnect();
      stop();
    };
  }, []);

  const copyEmail = async () => {
    if (copyBusy.current) return;
    copyBusy.current = true;
    setCopyStatus("正在复制…");
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopyStatus("邮箱已复制");
    } catch {
      setCopyStatus(EMAIL);
    } finally {
      copyBusy.current = false;
    }
  };

  return (
    <footer ref={footerRef} className={styles.footer} id="contact" aria-label="温一帆作品集页脚">
      <FooterDissolve />
      <div className={styles.scene} aria-hidden="true">
        <Image
          ref={imageRef}
          className={styles.landscape}
          src={assetPath("synthesis/footer/material-landscape.webp")}
          alt=""
          width={1536}
          height={1024}
          sizes="100vw"
          unoptimized
        />
      </div>
      <div className={styles.content} data-footer-paper>
        <div className={styles.top}>
          <div>
            <TransitionLink className={styles.wordmark} href="/synthesis" aria-label="温一帆，前往作品集首页">
              WEN<span>YIFAN</span><span className={styles.nameCn}>温一帆</span>
            </TransitionLink>
            <p className={styles.description}>Graphic, brand &amp; packaging design.<br />Turning ideas into visual identities,<br />objects and spaces.</p>
            <p className={styles.descriptionCn}>从一个想法出发，连接品牌、包装与三维表达。</p>
            <div className={styles.actions} aria-label="联系与简历">
              <a href={`mailto:${EMAIL}`} aria-label="发送邮件给温一帆" title="发送邮件"><Mail aria-hidden="true" /><span>Email</span></a>
              <a href={assetPath("Wen-Yifan-Resume.pdf")} download="Wen-Yifan-Resume.pdf" aria-label="下载温一帆的简历 PDF" title="下载简历 PDF"><ArrowDownToLine aria-hidden="true" /><span>Résumé</span></a>
            </div>
          </div>

          <div className={styles.columns}>
            <nav className={styles.column} aria-labelledby="film-footer-explore">
              <h2 className={styles.columnTitle} id="film-footer-explore">Explore<span>浏览</span></h2>
              <TransitionLink href="/synthesis">Home</TransitionLink>
              <TransitionLink href={isHome ? "#work" : "/synthesis#work"}>Selected work</TransitionLink>
              <TransitionLink href="/synthesis/about">About me</TransitionLink>
            </nav>
            <nav className={styles.column} aria-labelledby="film-footer-projects">
              <h2 className={styles.columnTitle} id="film-footer-projects">Projects<span>作品</span></h2>
              <TransitionLink href="/synthesis/projects/stoa">Stoa</TransitionLink>
              <TransitionLink href="/synthesis/projects/margin">映间 MARGIN</TransitionLink>
              <TransitionLink href="/synthesis/projects/roku-ikition">Roku Ikition</TransitionLink>
              <TransitionLink href="/synthesis/projects/packaging-design">Packaging</TransitionLink>
              <TransitionLink href="/synthesis/projects/runes">Runes</TransitionLink>
              <TransitionLink href="/synthesis/projects/vitrolume">Vitrolume</TransitionLink>
            </nav>
            <div className={styles.column} aria-labelledby="film-footer-contact">
              <h2 className={styles.columnTitle} id="film-footer-contact">Get in touch<span>联系</span></h2>
              <a className={styles.email} href={`mailto:${EMAIL}`}>2742733283<br />@qq.com <ArrowUpRight aria-hidden="true" /></a>
              <button className={styles.copy} type="button" onClick={copyEmail} data-copied={copied} aria-label="Copy email" aria-busy={copyStatus === "正在复制…"}>
                <span className={styles.copyLabels} aria-hidden="true"><span>Copy email</span><span>Copied</span></span>
                <span className={styles.copyIcon} aria-hidden="true">{copied ? <Check /> : <Copy />}</span>
              </button>
              <p className={styles.copyStatus} role="status" aria-live="polite">{copyStatus}</p>
            </div>
          </div>
        </div>
        <div className={styles.bottom}>
          <p>© 2026 WEN YIFAN</p>
          <p>Graphic · Brand · Packaging · 3D</p>
          <TransitionLink href="#top">Back to top <span aria-hidden="true">↑</span></TransitionLink>
        </div>
      </div>
    </footer>
  );
}
