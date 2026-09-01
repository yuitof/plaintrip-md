import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

function normalizeBase(value: string | undefined): string {
  if (!value || value.trim() === "/") return "/";
  return `/${value.trim().replace(/^\/+|\/+$/g, "")}/`;
}

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const workerSafeYaml = fileURLToPath(
  new URL("./node_modules/yaml/browser/index.js", import.meta.url),
);

export default defineConfig({
  root: "github-pages",
  base: normalizeBase(process.env.PLAINTRIP_BASE_PATH),
  plugins: [react()],
  resolve: {
    alias: [
      { find: "@", replacement: projectRoot },
      { find: /^yaml$/, replacement: workerSafeYaml },
    ],
  },
  build: {
    outDir: "../out-pages",
    emptyOutDir: true,
  },
});
