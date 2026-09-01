import { copyFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const result = spawnSync(
  "vite",
  ["build", "--config", "vite.github-pages.config.ts"],
  { stdio: "inherit", shell: process.platform === "win32" },
);

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

await Promise.all([
  copyFile("out-pages/index.html", "out-pages/404.html"),
  copyFile("app/icon.svg", "out-pages/icon.svg"),
  copyFile("app/opengraph-image.png", "out-pages/opengraph-image.png"),
  copyFile("app/twitter-image.png", "out-pages/twitter-image.png"),
  writeFile("out-pages/.nojekyll", ""),
]);

console.log("GitHub Pages artifact created in out-pages/.");
