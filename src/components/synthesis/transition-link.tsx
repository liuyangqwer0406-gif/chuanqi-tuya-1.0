"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";
import { useSmoothScroll } from "@/components/motion/smooth-motion-provider";
import { getBasePath } from "@/lib/assets";
import {
  SYNTHESIS_NAVIGATION_START,
  type SynthesisNavigationDetail,
  type SynthesisTransitionCover,
} from "./route-events";

type TransitionLinkProps = ComponentProps<typeof Link>;

const ROUTE_LEAVE_DURATION = 720;

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
      typeof href !== "string" ||
      href.startsWith("mailto:") ||
      href.startsWith("http")
    ) return;

    const destination = new URL(href, window.location.href);
    if (destination.origin !== window.location.origin) return;

    const basePath = getBasePath();
    const withoutBasePath = (pathname: string) => (
      basePath && (pathname === basePath || pathname.startsWith(`${basePath}/`))
        ? pathname.slice(basePath.length) || "/"
        : pathname
    );
    const currentPathname = withoutBasePath(window.location.pathname);
    const destinationPathname = withoutBasePath(destination.pathname);
    const browserPathname = basePath && !destination.pathname.startsWith(`${basePath}/`)
      ? `${basePath}${destination.pathname}`
      : destination.pathname;

    const root = document.documentElement;
    if (root.dataset.routeState && root.dataset.routeState !== "idle") {
      event.preventDefault();
      return;
    }

    const sameDocument = destinationPathname.replace(/\/$/, "") === currentPathname.replace(/\/$/, "")
      && destination.search === window.location.search;
    const pointerInitiated = event.detail > 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches || !pointerInitiated;

    if (sameDocument) {
      event.preventDefault();
      root.classList.remove("is-route-leaving");
      root.dataset.routeState = "idle";

      if (destination.hash) {
        const target = document.getElementById(decodeURIComponent(destination.hash.slice(1)));
        window.history.pushState(window.history.state, "", `${browserPathname}${destination.search}${destination.hash}`);
        if (target) {
          const top = target.getBoundingClientRect().top + window.scrollY - Math.max(88, parseFloat(getComputedStyle(target).scrollMarginTop) || 0);
          scrollTo(top, reducedMotion ? { immediate: true, duration: 0 } : { duration: .8 });
        }
      } else {
        window.history.replaceState(window.history.state, "", `${browserPathname}${destination.search}`);
        scrollTo(0, reducedMotion ? { immediate: true, duration: 0 } : { duration: .8 });
      }
      return;
    }

    event.preventDefault();
    const coverImage = document.querySelector<HTMLImageElement>("[data-transition-cover] img");
    let cover: SynthesisTransitionCover | undefined;

    if (!reducedMotion && coverImage) {
      const rect = coverImage.closest<HTMLElement>("[data-transition-cover]")?.getBoundingClientRect()
        ?? coverImage.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight) {
        const coverNode = coverImage.closest<HTMLElement>("[data-transition-cover]");
        const imageStyle = window.getComputedStyle(coverImage);
        cover = {
          src: coverImage.currentSrc || coverImage.src,
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          objectPosition: imageStyle.objectPosition || "50% 50%",
          objectFit: imageStyle.objectFit || "cover",
          backgroundColor: coverNode ? window.getComputedStyle(coverNode).backgroundColor : "rgb(17, 17, 17)",
        };
      }
    }

    if (currentPathname.startsWith("/synthesis/projects/") && destinationPathname === "/synthesis") {
      const currentSlug = currentPathname.split("/").filter(Boolean).at(-1);
      if (currentSlug) window.sessionStorage.setItem("synthesis:return-project", currentSlug);
    }

    const rawLabel = event.currentTarget.getAttribute("data-transition-label")
      || event.currentTarget.getAttribute("aria-label")
      || event.currentTarget.textContent
      || "NEXT VIEW";
    const detail: SynthesisNavigationDetail = {
      href: `${destinationPathname}${destination.search}${destination.hash}`,
      pathname: destinationPathname,
      label: rawLabel.replace(/^Open case study:\s*/i, "").replace(/\s+/g, " ").trim(),
      reducedMotion,
      origin: pointerInitiated ? {
        x: Math.min(1, Math.max(0, event.clientX / window.innerWidth)),
        y: Math.min(1, Math.max(0, event.clientY / window.innerHeight)),
      } : undefined,
      cover,
    };

    root.dataset.routeState = "leaving";
    root.classList.add("is-route-leaving");
    window.dispatchEvent(new CustomEvent<SynthesisNavigationDetail>(SYNTHESIS_NAVIGATION_START, { detail }));

    if (reducedMotion) {
      router.push(href);
      return;
    }

    window.setTimeout(() => router.push(href), ROUTE_LEAVE_DURATION);
  };

  return <Link href={href} onClick={handleClick} {...props} />;
}
