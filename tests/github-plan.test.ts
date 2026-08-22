import assert from "node:assert/strict";
import test from "node:test";
import { loadGitHubHome, loadGitHubTrip } from "../lib/github-plan.ts";

const plan = `---
title: Test trip
description: Loaded from the mock GitHub repository.
route: Tokyo → Kyoto
budget: 1 JPY
updated: 2026-08-22
---

## Before you go

- [ ] Pack

## Itinerary

### One day
\`2026-08-22\` · Japan Standard Time

| Time | Plan | Details | Status |
| --- | --- | --- | --- |
| 09:00–10:00 | Test | A row | Planned |

## Ideas to discuss

### Ideas

- One idea

## Practical notes

- One note
`;

const config = `
version: 1
routes:
  /: plans/china.md
  /travel-plan: plans/china.md
  /packing: notes/packing.md
  /folder/nested: another-name.md
`;

const homeConfig = `
version: 1
routes:
  /:
    repository: a-trip
    file: plans/china.md
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
    "/someone/a-trip/main/plans/china.md": plan,
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
    if (root.status === "ok") assert.equal(root.filePath, "plans/china.md");

    const alias = await loadGitHubTrip("someone", "a-trip", ["travel-plan"]);
    assert.equal(alias.status, "ok");
    if (alias.status === "ok") assert.equal(alias.filePath, "plans/china.md");

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
      assert.equal(home.filePath, "plans/china.md");
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
