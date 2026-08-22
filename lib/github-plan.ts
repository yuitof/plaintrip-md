import { parse as parseYaml } from "yaml";

const RAW_GITHUB = "https://raw.githubusercontent.com";
const ROUTE_FILES = ["route.yaml", "route.yml"];
const BRANCH_CANDIDATES = ["main", "master"];

type RouteTarget = {
  repository: string;
  filePath: string;
};

type RouteConfig = {
  routes: Record<string, RouteTarget>;
};

type LocatedConfig = {
  config: RouteConfig;
  branch: string;
};

export type RemoteTripResult =
  | {
      status: "ok";
      source: string;
      branch: string;
      repository: string;
      filePath: string;
      repositoryUrl: string;
    }
  | { status: "invalid" | "not-found" | "upstream-error" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validRepositoryName(value: string) {
  return (
    value.length <= 100 &&
    /^[a-zA-Z0-9_.-]+$/.test(value) &&
    value !== "." &&
    value !== ".."
  );
}

function normalizeRepoPath(value: string): string | null {
  const normalized = value.replace(/^\/+|\/+$/g, "");
  if (!normalized || normalized.length > 500 || normalized.includes("\\")) return null;
  const segments = normalized.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) return null;
  return segments.join("/");
}

function normalizeRoute(value: string): string | null {
  if (value.trim() === "/") return "/";
  const path = normalizeRepoPath(value.trim());
  return path ? `/${path}` : null;
}

function parseTarget(value: unknown, currentRepository: string): RouteTarget | null {
  if (typeof value === "string") {
    const filePath = normalizeRepoPath(value);
    return filePath ? { repository: currentRepository, filePath } : null;
  }

  if (!isRecord(value)) return null;
  const repositoryValue = value.repository ?? value.repo ?? currentRepository;
  const fileValue = value.file ?? value.path;
  if (typeof repositoryValue !== "string" || !validRepositoryName(repositoryValue)) return null;
  if (typeof fileValue !== "string") return null;
  const filePath = normalizeRepoPath(fileValue);
  return filePath ? { repository: repositoryValue, filePath } : null;
}

function parseRouteConfig(source: string, currentRepository: string): RouteConfig {
  const parsed = parseYaml(source) as unknown;
  const root = isRecord(parsed) ? parsed : {};
  const routes: Record<string, RouteTarget> = {};

  if (isRecord(root.routes)) {
    for (const [routeValue, targetValue] of Object.entries(root.routes)) {
      const route = normalizeRoute(routeValue);
      const target = parseTarget(targetValue, currentRepository);
      if (route && target) routes[route] = target;
    }
  }

  return { routes };
}

function rawUrl(owner: string, repository: string, branch: string, filePath: string) {
  const encodedPath = filePath.split("/").map(encodeURIComponent).join("/");
  return (
    RAW_GITHUB +
    "/" +
    encodeURIComponent(owner) +
    "/" +
    encodeURIComponent(repository) +
    "/" +
    encodeURIComponent(branch) +
    "/" +
    encodedPath
  );
}

async function readText(url: string): Promise<Response | null> {
  try {
    return await fetch(url, {
      headers: { Accept: "text/plain" },
      next: { revalidate: 60 },
    });
  } catch {
    return null;
  }
}

async function findRouteConfig(
  owner: string,
  repository: string,
): Promise<LocatedConfig | RemoteTripResult> {
  for (const branch of BRANCH_CANDIDATES) {
    for (const routeFile of ROUTE_FILES) {
      const response = await readText(rawUrl(owner, repository, branch, routeFile));
      if (!response) return { status: "upstream-error" };
      if (response.ok) {
        try {
          return {
            config: parseRouteConfig(await response.text(), repository),
            branch,
          };
        } catch {
          return { status: "invalid" };
        }
      }
      if (response.status !== 404) return { status: "upstream-error" };
    }
  }

  return { status: "not-found" };
}

async function fetchTarget(
  owner: string,
  target: RouteTarget,
  preferredBranch?: string,
): Promise<RemoteTripResult> {
  const branches = preferredBranch ? [preferredBranch] : BRANCH_CANDIDATES;

  for (const branch of branches) {
    const response = await readText(rawUrl(owner, target.repository, branch, target.filePath));
    if (!response) return { status: "upstream-error" };
    if (response.ok) {
      const source = await response.text();
      if (source.length > 1_000_000) return { status: "invalid" };
      return {
        status: "ok",
        source,
        branch,
        repository: target.repository,
        filePath: target.filePath,
        repositoryUrl: `https://github.com/${owner}/${target.repository}`,
      };
    }
    if (response.status !== 404) return { status: "upstream-error" };
  }

  return { status: "not-found" };
}

async function loadConfiguredRoute(
  owner: string,
  configRepository: string,
  route: string,
): Promise<RemoteTripResult> {
  if (!validRepositoryName(owner) || !validRepositoryName(configRepository)) {
    return { status: "invalid" };
  }

  const located = await findRouteConfig(owner, configRepository);
  if (!("config" in located)) return located;

  const target = located.config.routes[route];
  if (!target) return { status: "not-found" };
  const preferredBranch =
    target.repository === configRepository ? located.branch : undefined;
  return fetchTarget(owner, target, preferredBranch);
}

export async function loadGitHubHome(owner: string): Promise<RemoteTripResult> {
  return loadConfiguredRoute(owner, owner, "/");
}

export async function loadGitHubTrip(
  owner: string,
  repository: string,
  routeSegments: string[] = [],
): Promise<RemoteTripResult> {
  const route = routeSegments.length
    ? normalizeRoute(routeSegments.join("/"))
    : "/";
  if (!route) return { status: "invalid" };
  return loadConfiguredRoute(owner, repository, route);
}
