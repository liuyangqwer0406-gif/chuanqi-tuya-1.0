"use client";

import { useEffect, useRef, useState } from "react";
import { useSmoothScroll } from "@/components/motion/smooth-motion-provider";
import { ParticleField } from "./particle-field";

const chapters = [
  { title: "BRAND\nSYSTEMS", cn: "品牌与包装", body: "做一套好用的字标、颜色与排版规则，让它在包装、海报和屏幕上看起来都是一家人。", label: "IDENTITY / PACKAGING", shape: "SYSTEM" },
  { title: "SPATIAL\nIMAGE", cn: "三维与空间", body: "不用假大空的渲染。用扎实的模型结构、微距材质和布光，把产品在空间里的样子交代清楚。", label: "FORM / MATERIAL / LIGHT", shape: "VOLUME" },
  { title: "INTERACTIVE\nSTORY", cn: "网页与原型", body: "自己动手写代码做交互。把静态平面连成有节奏的网页，让人能在屏幕里自然点开翻阅。", label: "STRUCTURE / INTERACTION", shape: "INTERFACE" },
];

export function EvolutionStory() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const { scrollTo } = useSmoothScroll();

  useEffect(() => {
    const section = root.current;
    if (!section) return;
    const flowLayout = matchMedia("(max-width: 800px), (max-height: 680px), (prefers-reduced-motion: reduce)");
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (72 - rect.top) / Math.max(1, section.offsetHeight - innerHeight)));
      let current = Math.min(2, Math.floor(progress * 3));
      if (flowLayout.matches) {
        current = 0;
        section.querySelectorAll(".evolution-story__chapter").forEach((chapter, index) => {
          if (chapter.getBoundingClientRect().top <= Math.min(180, innerHeight * .3)) current = index;
        });
      }
      setActive(current);
      section.style.setProperty("--practice-progress", String(progress));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    flowLayout.addEventListener("change", schedule);
    schedule();
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); flowLayout.removeEventListener("change", schedule); };
  }, []);

  const jump = (index: number) => {
    const section = root.current;
    if (!section) return;
    if (matchMedia("(max-width: 800px), (max-height: 680px), (prefers-reduced-motion: reduce)").matches) {
      const chapter = section.querySelector(`#practice-${index}`);
      if (chapter) scrollTo(chapter.getBoundingClientRect().top + window.scrollY - 100, { duration: .85 });
    } else {
      const top = section.getBoundingClientRect().top + scrollY - 72;
      scrollTo(top + (section.offsetHeight - innerHeight) * (index / 3 + .12), { duration: .85 });
    }
  };

  return (
    <section ref={root} className="evolution-story" id="practice" aria-labelledby="practice-title">
      <div className="evolution-story__sticky">
        <header className="evolution-story__header"><p>CONNECTED PRACTICE / 设计能力</p><h2 id="practice-title">ONE IDEA.<br /><span>MANY FORMS.</span></h2><p>平时主要做三件事：品牌、三维和网页。<br />方法其实一样：定好基础规则，再去不同载体上试。</p></header>
        <div className="evolution-story__stage">
          <div className="evolution-story__visual"><ParticleField variant="practice" /><span aria-hidden="true">FORM STUDY / {chapters[active].shape}</span></div>
          <div className="evolution-story__chapters">
            {chapters.map((chapter, index) => <article id={`practice-${index}`} key={chapter.cn} className={`evolution-story__chapter${active === index ? " is-current" : ""}`}>
              <span className="evolution-story__number" aria-hidden="true">0{index + 1}</span>
              <p className="evolution-story__label">{chapter.label}</p>
              <h3>{chapter.title}</h3><h4>{chapter.cn}</h4><p className="evolution-story__body">{chapter.body}</p>
            </article>)}
          </div>
        </div>
        <nav className="evolution-story__nav" aria-label="Design practice chapters">
          {chapters.map((chapter, index) => <button key={chapter.cn} type="button" aria-current={index === active ? "step" : undefined} onClick={() => jump(index)}><span>0{index + 1}</span>{chapter.cn}<i aria-hidden="true">↗</i></button>)}
        </nav>
      </div>
    </section>
  );
}
