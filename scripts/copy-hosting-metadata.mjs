import { access, copyFile, mkdir } from "node:fs/promises";

let hasMetadata = true;

try {
  await access(".openai/hosting.json");
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
  hasMetadata = false;
  console.warn("No local .openai/hosting.json found; skipping Sites metadata copy.");
}

if (hasMetadata) {
  await mkdir("dist/.openai", { recursive: true });
  await copyFile(".openai/hosting.json", "dist/.openai/hosting.json");
}
