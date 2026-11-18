"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";
import { useSmoothScroll } from "@/components/motion/smooth-motion-provider";
import {
  SYNTHESIS_NAVIGATION_START,
  type SynthesisNavigationDetail,
  normalizeRoutePath,
} from "./route-events";

type TransitionLinkProps = ComponentProps<typeof Link>;


export function TransitionLink({ href, onClick, ...props }: TransitionLinkProps) {
  const router = useRouter();
  const { scrollTo } = useSmoothScroll();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      props.download || (props.target && props.target !== "_self") ||
      typeof href !== "string" ||
      href.startsWith("mailto:") ||
      href.startsWith("http")
    ) return;

    const destination = new URL(event.currentTarget.href);
    if (destination.origin !== window.location.origin) return;

    const root = document.documentElement;
    if (root.dataset.routeState && root.dataset.routeState !== "idle") {
      event.preventDefault();
      return;
    }

    const sameDocument = normalizeRoutePath(destination.pathname) === normalizeRoutePath(window.location.pathname)
      && destination.search === window.location.search;

    if (sameDocument) {
      event.preventDefault();
      root.classList.remove("is-route-leaving");
      root.dataset.routeState = "idle";

      if (destination.hash) {
        const target = document.getElementById(decodeURIComponent(destination.hash.slice(1)));
        if (destination.href !== location.href) window.history.pushState(window.history.state, "", destination.href);
        if (target) {
          const top = target.getBoundingClientRect().top + window.scrollY - Math.max(88, parseFloat(getComputedStyle(target).scrollMarginTop) || 0);
          scrollTo(top, { duration: .65, immediate: event.detail === 0 || matchMedia("(prefers-reduced-motion: reduce)").matches });
        }
      } else {
        window.history.replaceState(window.history.state, "", `${destination.pathname}${destination.search}`);
        scrollTo(0, { duration: .65, immediate: event.detail === 0 || matchMedia("(prefers-reduced-motion: reduce)").matches });
      }
      return;
    }

    event.preventDefault();
    const pointerInitiated = event.detail > 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches || !pointerInitiated;
    if (normalizeRoutePath(window.location.pathname).startsWith("/synthesis/projects/") && normalizeRoutePath(destination.pathname) === "/synthesis") {
      const currentSlug = window.location.pathname.split("/").filter(Boolean).at(-1);
      if (currentSlug) window.sessionStorage.setItem("synthesis:return-project", currentSlug);
    }

    const rawLabel = event.currentTarget.getAttribute("data-transition-label")
      || event.currentTarget.getAttribute("aria-label")
      || event.currentTarget.textContent
      || "NEXT VIEW";
    const detail: SynthesisNavigationDetail = {
      href: `${destination.pathname}${destination.search}${destination.hash}`,
      pathname: normalizeRoutePath(destination.pathname),
      label: rawLabel.replace(/^Open case study:\s*/i, "").replace(/\s+/g, " ").trim(),
      reducedMotion,
      navigate: () => router.push(href),
    };

    window.dispatchEvent(new CustomEvent<SynthesisNavigationDetail>(SYNTHESIS_NAVIGATION_START, { detail }));

  };

  return <Link href={href} onClick={handleClick} {...props} />;
}
