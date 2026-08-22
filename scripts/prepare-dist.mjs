import { rename, rm } from "node:fs/promises";

await rm("dist", { force: true, recursive: true });
await rename("out", "dist");
