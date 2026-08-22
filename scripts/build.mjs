import { spawnSync } from "node:child_process";

const forceSites = process.argv.includes("--sites");
const isVercel = process.env.VERCEL === "1" && !forceSites;
const command = isVercel ? "next" : "vinext";
const result = spawnSync(command, ["build"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

if (!isVercel) {
  await import("./patch-worker-runtime.mjs");
  await import("./copy-hosting-metadata.mjs");
}
