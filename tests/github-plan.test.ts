import assert from "node:assert/strict";
import test from "node:test";
import { loadGitHubHome, loadGitHubTrip } from "../lib/github-plan.ts";

const plan = `---
type: tripmd
title: Test trip
description: Loaded from the mock GitHub repository.
tags: [Japan]
budget: 1000 JPY
currency: JPY
timezone: Asia/Tokyo
---

## 2026-08-22 @Asia/Tokyo

> [09:00] - [10:00] train Test ride :: Tokyo - Kyoto
>
> - price: 100 JPY
`;

const config = `
version: 1
routes:
  /: plaintrip.md
  /plaintrip: plaintrip.md
  /packing: notes/packing.md
  /folder/nested: another-name.md
`;

const homeConfig = `
version: 1
routes:
  /:
    repository: a-trip
    file: plaintrip.md
`;

const oldConfig = `
version: 1
routes:
  /: itinerary-with-any-name.md
`;

function responseFor(url: string): Response {
  const path = new URL(url).pathname;
  const files: Record<string, string> = {
    "/someone/a-trip/main/route.yaml": config,
    "/someone/a-trip/main/plaintrip.md": plan,
    "/someone/a-trip/main/notes/packing.md": plan,
    "/someone/a-trip/main/another-name.md": plan,
    "/someone/someone/main/route.yaml": homeConfig,
    "/someone/old-trip/master/route.yaml": oldConfig,
    "/someone/old-trip/master/itinerary-with-any-name.md": plan,
  };
  return path in files
    ? new Response(files[path], { status: 200 })
    : new Response("not found", { status: 404 });
}

test("explicit GitHub routes, owner homes, aliases, and branches", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => responseFor(String(input));

  try {
    const root = await loadGitHubTrip("someone", "a-trip");
    assert.equal(root.status, "ok");
    if (root.status === "ok") {
      assert.equal(root.filePath, "plaintrip.md");
      assert.match(root.source, /type: tripmd/);
    }

    const alias = await loadGitHubTrip("someone", "a-trip", ["plaintrip"]);
    assert.equal(alias.status, "ok");
    if (alias.status === "ok") assert.equal(alias.filePath, "plaintrip.md");

    const packing = await loadGitHubTrip("someone", "a-trip", ["packing"]);
    assert.equal(packing.status, "ok");
    if (packing.status === "ok") assert.equal(packing.filePath, "notes/packing.md");

    const nested = await loadGitHubTrip("someone", "a-trip", ["folder", "nested"]);
    assert.equal(nested.status, "ok");
    if (nested.status === "ok") assert.equal(nested.filePath, "another-name.md");

    const home = await loadGitHubHome("someone");
    assert.equal(home.status, "ok");
    if (home.status === "ok") {
      assert.equal(home.repository, "a-trip");
      assert.equal(home.filePath, "plaintrip.md");
    }

    const missing = await loadGitHubTrip("someone", "a-trip", ["missing"]);
    assert.equal(missing.status, "not-found");

    const oldBranch = await loadGitHubTrip("someone", "old-trip");
    assert.equal(oldBranch.status, "ok");
    if (oldBranch.status === "ok") {
      assert.equal(oldBranch.branch, "master");
      assert.equal(oldBranch.filePath, "itinerary-with-any-name.md");
    }

    assert.deepEqual(await loadGitHubTrip("not/valid", "a-trip"), { status: "invalid" });

    globalThis.fetch = async () => {
      throw new Error("offline");
    };
    assert.deepEqual(await loadGitHubTrip("someone", "a-trip"), {
      status: "upstream-error",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
