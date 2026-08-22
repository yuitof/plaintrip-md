import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import test from "node:test";
// @ts-expect-error The development helper is intentionally plain ESM.
import { loadLocalPlan, startLocalPreviewServer } from "../scripts/local-preview-server.mjs";

test("a local folder resolves its explicit root route on every read", async () => {
  const folder = await mkdtemp(join(tmpdir(), "plaintrip-local-"));
  try {
    await mkdir(join(folder, "plans"));
    await writeFile(join(folder, "route.yaml"), "routes:\n  /: plans/trip.md\n");
    await writeFile(join(folder, "plans/trip.md"), "---\ntitle: First title\n---\n");

    const first = await loadLocalPlan(folder);
    assert.equal(first.filePath, "plans/trip.md");
    assert.equal(first.folderName, basename(folder));
    assert.match(first.source, /First title/);

    await writeFile(join(folder, "plans/trip.md"), "---\ntitle: Updated title\n---\n");
    const updated = await loadLocalPlan(folder);
    assert.match(updated.source, /Updated title/);
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});

test("the local service notices Markdown saves and serves the new source", async () => {
  const folder = await mkdtemp(join(tmpdir(), "plaintrip-local-"));
  let server: Awaited<ReturnType<typeof startLocalPreviewServer>> | undefined;
  try {
    await writeFile(join(folder, "route.yaml"), "routes:\n  /: trip.md\n");
    await writeFile(join(folder, "trip.md"), "---\ntitle: First title\n---\n");
    server = await startLocalPreviewServer(folder);

    const initial = await fetch(`${server.url}/version`).then((response) => response.json()) as {
      version: number;
    };
    await writeFile(join(folder, "trip.md"), "---\ntitle: Live title\n---\n");

    let changedVersion = initial.version;
    const deadline = Date.now() + 2_000;
    while (changedVersion === initial.version && Date.now() < deadline) {
      await new Promise((resolveWait) => setTimeout(resolveWait, 25));
      const value = await fetch(`${server.url}/version`).then((response) => response.json()) as {
        version: number;
      };
      changedVersion = value.version;
    }
    assert.ok(changedVersion > initial.version, "the folder watcher should report the save");

    const updated = await fetch(`${server.url}/plan`).then((response) => response.json()) as {
      source: string;
    };
    assert.match(updated.source, /Live title/);
  } finally {
    await server?.close();
    await rm(folder, { recursive: true, force: true });
  }
});

test("a local root route cannot escape its itinerary folder", async () => {
  const folder = await mkdtemp(join(tmpdir(), "plaintrip-local-"));
  try {
    await writeFile(join(folder, "route.yaml"), "routes:\n  /: ../outside.md\n");
    await assert.rejects(loadLocalPlan(folder), /must map routes\["\/"\] to a Markdown file/);
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
});
