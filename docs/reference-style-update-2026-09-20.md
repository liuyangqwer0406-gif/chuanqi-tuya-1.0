# Reference-driven style and motion update — 2026-09-20

This update translates selected patterns from six public reference libraries into the existing Cinema Black / Editorial Paper / Signal Orange portfolio language. It does not copy a full component or add a runtime dependency.

## Reference decisions

- [Anime.js](https://animejs.com/documentation/): used the ideas of scroll-synchronised sequencing and interruptible motion. The implementation stays on the project’s existing browser APIs and GSAP stack.
- [MotionSites](https://www.motionsites.org/explore): used the idea of distinct scroll chapters with one clear motion premise per chapter.
- [Showreel Design](https://showreel.design/): retained a media-first reel rhythm and kept project information secondary to the work image.
- [React Bits](https://reactbits.dev/get-started/index): adapted restrained masked content reveals instead of importing a generic text-effect component.
- [Aceternity UI](https://ui.aceternity.com/): adapted the tracing-line and parallax principles while omitting gradients, glass panels, and SaaS blocks.
- [Uiverse](https://uiverse.io/): adapted small focus, hover, and press feedback rather than pasting a community component.

## Implemented changes

1. The selected-project underline now uses an interruptible transform transition instead of a replaying keyframe.
2. The full-cover link gains two small signal-orange corner marks on hover or focus, with no duplicate label or CTA.
3. The current project image settles by 1.2% on precise-pointer focus, leaving touch behavior unchanged.
4. The work title now includes an archive index and a single signal line that draws when the section enters.
5. Work heading, profile image/copy, and contact content use one-shot entrance choreography. Reduced-motion users receive static content immediately.
6. Every case-study hero now exposes its project number, year, and existing status beside the discipline.
7. The overview and chapter headers use editorial labels with chapter and image counts derived from existing project data.
8. Each chapter's first unshaped image becomes a full-width lead image on desktop, restoring a clearer showreel rhythm; mobile returns to a single-column 4:3 gallery.
9. Overview columns, chapter headings, media, the closing statement, and project navigation use the same one-shot reveal language as the homepage.
10. Previous and next case-study links now use the neighboring projects' existing cover images as restrained background previews.

## Verification

Latest user-directed refinement: all `LiquidLink` instances now default to always-on lighting, including pill and orb variants in the home, case studies, and ThreeUI pages. Offscreen/hidden rendering still pauses; reduced motion uses the static orange fallback. The shader owns the sole visible rim: the redundant CSS border is transparent when ready, iframe bounds match the host border box, and the thin rim is rendered at 2x resolution. Desktop checks cover all seven component placements, with mobile and reduced-motion checks on all three homepage buttons. The updated motion audit passes with the new always-on expectations.

- Targeted ESLint: PASS.
- Next.js static build: PASS, 22 pages.
- Reference-style browser check: PASS at 1440px, 390px, and reduced motion.
- Case-study browser check: PASS on all seven project routes; mobile lightbox next/close and reduced motion also pass.
- Layout audit: PASS across 35 route/viewport combinations, including all seven projects at 1440px, 900px, and 320px.
- Motion regression: PASS for hero, project index, route changes, galleries, mobile, and reduced motion.
- Export audit: PASS for 22 HTML pages and 725 local references; all audited page images decode and no browser errors or failed resources occur.
