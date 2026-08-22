import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { Parser } from "expr-eval";
import { parseItinerary, type ItineraryEventNode } from "../lib/itinerary.ts";

test("the bundled plan uses TripMD headings, events, alerts, and frontmatter", () => {
  const parsed = parseItinerary(readFileSync("sample-travel-plan.md", "utf8"));
  const counts = parsed.root.children.reduce<Record<string, number>>((result, node) => {
    result[node.type] = (result[node.type] ?? 0) + 1;
    return result;
  }, {});

  assert.equal(parsed.frontmatter.type, "tripmd");
  assert.equal(parsed.frontmatter.title, "China trip · 2026");
  assert.deepEqual(parsed.frontmatter.tags, ["China", "Friends", "2026"]);
  assert.equal(parsed.frontmatter.updated, "2026-08-22");
  assert.equal(counts.itmdHeading, 16);
  assert.equal(counts.itmdEvent, 47);
  assert.equal(counts.itmdAlert, 1);
});

test("TripMD price arithmetic remains compatible and arithmetic-only", () => {
  const parsed = parseItinerary(`---
type: tripmd
title: Price test
currency: USD
timezone: UTC
---
## 2026-01-01

> [09:00] - [10:00+1] train A train :: A - B
>
> - price: {25*4} USD
`);
  const event = parsed.root.children.find(
    (node): node is ItineraryEventNode => node.type === "itmdEvent",
  );
  const token = event?.data?.itmdPrice?.[0]?.price.tokens?.[0];

  assert.equal(event?.time?.kind, "range");
  assert.equal(token?.kind, "money");
  assert.equal(token?.normalized?.amount, "100");
  assert.equal(Parser.evaluate("(25 + 5) * 4"), 120);
  assert.throws(() => Parser.evaluate("constructor.constructor('return 1')()"));
  assert.throws(() => Parser.evaluate("2; process.exit()"));
});

test("ordinary Markdown stays ordinary when TripMD mode is not declared", () => {
  const parsed = parseItinerary("# Notes\n\n> [09:00] train This remains a quote\n");
  assert.deepEqual(parsed.root.children.map((node) => node.type), ["heading", "blockquote"]);
});
