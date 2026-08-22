import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const serverDirectory = "dist/server";
const moduleUrlExpression = "import.meta.url";
const workerModuleUrl =
  '(typeof import.meta.url === "string" ? import.meta.url : typeof import.meta.filename === "string" ? import.meta.filename : "/index.js")';

async function javascriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await javascriptFiles(path)));
    else if (entry.isFile() && entry.name.endsWith(".js")) files.push(path);
  }

  return files;
}

let patchedExpressions = 0;

for (const path of await javascriptFiles(serverDirectory)) {
  const source = await readFile(path, "utf8");
  if (!source.includes(moduleUrlExpression)) continue;

  const expressions = source.split(moduleUrlExpression).length - 1;
  await writeFile(
    path,
    source.replaceAll(moduleUrlExpression, workerModuleUrl),
    "utf8",
  );
  patchedExpressions += expressions;
}

if (patchedExpressions > 0) {
  console.log(
    `Patched ${patchedExpressions} worker module URL expression${patchedExpressions === 1 ? "" : "s"}.`,
  );
}
