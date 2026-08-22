import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import vinext from "vinext";

const workerSafeYaml = fileURLToPath(
  new URL("./node_modules/yaml/browser/index.js", import.meta.url),
);

export default defineConfig({
  plugins: [vinext()],
  resolve: {
    // The Node entry is CommonJS and emits createRequire(import.meta.url), but
    // hosted worker runtimes do not guarantee that import.meta.url is present.
    alias: [{ find: /^yaml$/, replacement: workerSafeYaml }],
  },
});
