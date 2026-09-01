export const TEMPLATE_OWNER = "yuitof";
export const TEMPLATE_REPOSITORY = "plaintrip-md-template";

export type GitHubPagesTarget =
  | { kind: "template" }
  | { kind: "owner"; owner: string }
  | {
      kind: "repository";
      owner: string;
      repository: string;
      routeSegments: string[];
    }
  | { kind: "invalid" };

export function normalizePagesBasePath(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "/") return "/";
  return `/${trimmed.replace(/^\/+|\/+$/g, "")}`;
}

function decodeSegment(value: string): string | null {
  try {
    const decoded = decodeURIComponent(value);
    return decoded && decoded !== "." && decoded !== ".." ? decoded : null;
  } catch {
    return null;
  }
}

export function resolveGitHubPagesTarget(
  pathname: string,
  basePath: string,
): GitHubPagesTarget {
  const normalizedBase = normalizePagesBasePath(basePath);
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  let relativePath: string;

  if (normalizedBase === "/") {
    relativePath = normalizedPath;
  } else if (
    normalizedPath === normalizedBase ||
    normalizedPath.startsWith(`${normalizedBase}/`)
  ) {
    relativePath = normalizedPath.slice(normalizedBase.length) || "/";
  } else {
    return { kind: "invalid" };
  }

  const encodedSegments = relativePath.split("/").filter(Boolean);
  const segments = encodedSegments.map(decodeSegment);
  if (segments.some((segment) => segment === null)) return { kind: "invalid" };
  const decoded = segments as string[];

  if (!decoded.length) return { kind: "template" };
  if (decoded.length === 1) return { kind: "owner", owner: decoded[0] };
  return {
    kind: "repository",
    owner: decoded[0],
    repository: decoded[1],
    routeSegments: decoded.slice(2),
  };
}
