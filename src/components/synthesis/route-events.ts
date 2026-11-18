export const SYNTHESIS_NAVIGATION_START = "synthesis:navigation-start";
export const SYNTHESIS_ROUTE_READY = "synthesis:route-ready";

export function normalizeRoutePath(path: string) {
  return path.replace(/^\/(legendary-doodle1\.0|chuanqi-tuya-1\.0)(?=\/|$)/, "").replace(/\/+$/, "") || "/";
}

export type SynthesisNavigationDetail = {
  href: string;
  pathname: string;
  label: string;
  reducedMotion: boolean;
  navigate: () => void;
};

export type SynthesisRouteReadyDetail = {
  pathname: string;
  degraded?: boolean;
};

export function announceSynthesisRouteReady(pathname: string, degraded = false) {
  pathname = normalizeRoutePath(pathname);
  document.documentElement.dataset.routeReadyPath = pathname;
  window.dispatchEvent(new CustomEvent<SynthesisRouteReadyDetail>(SYNTHESIS_ROUTE_READY, {
    detail: { pathname, degraded },
  }));
}
