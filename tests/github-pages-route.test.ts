import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizePagesBasePath,
  resolveGitHubPagesTarget,
} from "../lib/github-pages-route.ts";

test("GitHub Pages base paths normalize for project and custom-domain sites", () => {
  assert.equal(normalizePagesBasePath("/"), "/");
  assert.equal(normalizePagesBasePath("/plaintrip-md/"), "/plaintrip-md");
  assert.equal(normalizePagesBasePath("plaintrip-md"), "/plaintrip-md");
});

test("GitHub Pages routes preserve PlainTrip owner, repository, and aliases", () => {
  assert.deepEqual(
    resolveGitHubPagesTarget("/plaintrip-md/", "/plaintrip-md"),
    { kind: "template" },
  );
  assert.deepEqual(
    resolveGitHubPagesTarget("/plaintrip-md/yuitof", "/plaintrip-md"),
    { kind: "owner", owner: "yuitof" },
  );
  assert.deepEqual(
    resolveGitHubPagesTarget(
      "/plaintrip-md/yuitof/itinerary-china-2026/packing/day-one",
      "/plaintrip-md",
    ),
    {
      kind: "repository",
      owner: "yuitof",
      repository: "itinerary-china-2026",
      routeSegments: ["packing", "day-one"],
    },
  );
});

test("GitHub Pages routing rejects paths outside the configured base", () => {
  assert.deepEqual(
    resolveGitHubPagesTarget("/another-app/yuitof/trip", "/plaintrip-md"),
    { kind: "invalid" },
  );
  assert.deepEqual(
    resolveGitHubPagesTarget("/plaintrip-md/%E0%A4%A", "/plaintrip-md"),
    { kind: "invalid" },
  );
});
