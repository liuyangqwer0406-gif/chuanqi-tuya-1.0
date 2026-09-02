const isGithubActions = typeof process !== "undefined" && process.env.GITHUB_ACTIONS === "true";
const repoName = isGithubActions && process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.replace(/.*?\//, "") : "";
const buildBasePath = repoName ? `/${repoName}` : "";

export function getBasePath(): string {
  if (typeof window !== "undefined") {
    if (window.location.pathname.startsWith("/chuanqi-tuya-1.0")) return "/chuanqi-tuya-1.0";
    if (window.location.pathname.startsWith("/legendary-doodle1.0")) return "/legendary-doodle1.0";
    return "";
  }
  return buildBasePath;
}

export function assetPath(path: string): string {
  if (!path) return path;
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) return path;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const base = getBasePath();
  if (base && cleanPath.startsWith(`${base}/`)) {
    return cleanPath;
  }
  return base ? `${base}${cleanPath}` : cleanPath;
}
