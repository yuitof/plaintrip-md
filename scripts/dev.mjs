import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { startLocalPreviewServer } from "./local-preview-server.mjs";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");
const args = process.argv.slice(2);
let localFolder;

if (args[0] === "--local") {
  args.shift();
  localFolder = args.shift();
  if (!localFolder) {
    throw new Error("--local requires an itinerary folder path.");
  }
} else if (args[0] && !args[0].startsWith("-")) {
  localFolder = args.shift();
}

const localPreview = localFolder
  ? await startLocalPreviewServer(resolve(localFolder))
  : undefined;

if (localPreview) {
  console.log(`Local itinerary: ${localPreview.folderPath}`);
  console.log("The root page will refresh when route.yaml or a Markdown file changes.\n");
}

const child = spawn(process.execPath, [nextBin, "dev", ...args], {
  env: {
    ...process.env,
    ...(localPreview ? { PLAINTRIP_LOCAL_PREVIEW_URL: localPreview.url } : {}),
  },
  stdio: "inherit",
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => child.kill(signal));
}

const exitCode = await new Promise((resolveExit, reject) => {
  child.once("error", reject);
  child.once("exit", (code, signal) => {
    resolveExit(code ?? (signal ? 1 : 0));
  });
});

await localPreview?.close();
process.exitCode = exitCode;
