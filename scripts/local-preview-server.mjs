import { watch } from "node:fs";
import { readFile, realpath, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { basename, isAbsolute, relative, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { parse as parseYaml } from "yaml";

const ROUTE_FILES = ["route.yaml", "route.yml"];
const MAX_SOURCE_BYTES = 1_000_000;

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeRepoPath(value) {
  const normalized = value.replace(/^\/+|\/+$/g, "");
  if (!normalized || normalized.length > 500 || normalized.includes("\\")) {
    return null;
  }
  const segments = normalized.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) {
    return null;
  }
  return segments.join("/");
}

function rootTarget(source) {
  const parsed = parseYaml(source);
  if (!isRecord(parsed) || !isRecord(parsed.routes)) return null;
  const target = parsed.routes["/"];
  if (typeof target === "string") return normalizeRepoPath(target);
  if (!isRecord(target)) return null;
  const file = target.file ?? target.path;
  return typeof file === "string" ? normalizeRepoPath(file) : null;
}

async function findRouteFile(folder) {
  for (const name of ROUTE_FILES) {
    const candidate = resolve(folder, name);
    try {
      if ((await stat(candidate)).isFile()) return candidate;
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  throw new Error("No route.yaml or route.yml was found in the local itinerary folder.");
}

function isInsideFolder(folder, target) {
  const pathFromFolder = relative(folder, target);
  return pathFromFolder === "" || (!pathFromFolder.startsWith("..") && !isAbsolute(pathFromFolder));
}

export async function loadLocalPlan(folder) {
  const folderPath = await realpath(resolve(folder));
  if (!(await stat(folderPath)).isDirectory()) {
    throw new Error(`Local itinerary path is not a folder: ${folder}`);
  }

  const routeFile = await findRouteFile(folderPath);
  const filePath = rootTarget(await readFile(routeFile, "utf8"));
  if (!filePath) {
    throw new Error('The local route file must map routes["/"] to a Markdown file.');
  }

  let sourcePath;
  try {
    sourcePath = await realpath(resolve(folderPath, filePath));
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new Error(`The local route / points to a missing file: ${filePath}`);
    }
    throw error;
  }
  if (!isInsideFolder(folderPath, sourcePath)) {
    throw new Error("The local route / must point to a file inside the itinerary folder.");
  }

  const sourceStats = await stat(sourcePath);
  if (!sourceStats.isFile()) {
    throw new Error(`The local route / does not point to a file: ${filePath}`);
  }
  if (sourceStats.size > MAX_SOURCE_BYTES) {
    throw new Error("The local itinerary is larger than 1 MB.");
  }

  return {
    source: await readFile(sourcePath, "utf8"),
    filePath,
    folderName: basename(folderPath),
  };
}

function sendJson(response, status, value) {
  response.writeHead(status, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(value));
}

export async function startLocalPreviewServer(folder) {
  const folderPath = await realpath(resolve(folder));
  await loadLocalPlan(folderPath);

  const token = randomUUID();
  let version = 1;
  const watcher = watch(folderPath, { recursive: true }, (_event, filename) => {
    if (!filename || /(?:^|[\\/])(?:route\.ya?ml|[^\\/]+\.md)$/i.test(String(filename))) {
      version += 1;
    }
  });

  const server = createServer(async (request, response) => {
    const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
    if (request.method !== "GET" || !requestUrl.pathname.startsWith(`/${token}/`)) {
      sendJson(response, 404, { error: "Not found" });
      return;
    }

    if (requestUrl.pathname === `/${token}/version`) {
      sendJson(response, 200, { version });
      return;
    }

    if (requestUrl.pathname === `/${token}/plan`) {
      try {
        sendJson(response, 200, { ...(await loadLocalPlan(folderPath)), version });
      } catch (error) {
        sendJson(response, 422, {
          error: error instanceof Error ? error.message : "Unable to load the local itinerary.",
        });
      }
      return;
    }

    sendJson(response, 404, { error: "Not found" });
  });

  await new Promise((resolveListening, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListening);
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    watcher.close();
    server.close();
    throw new Error("Unable to start the local itinerary service.");
  }

  return {
    folderPath,
    url: `http://127.0.0.1:${address.port}/${token}`,
    async close() {
      watcher.close();
      await new Promise((resolveClose) => server.close(resolveClose));
    },
  };
}
