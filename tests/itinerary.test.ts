import assert from "node:assert/strict";
import test from "node:test";
import { Parser } from "expr-eval";
import { parseItinerary, type ItineraryEventNode } from "../lib/itinerary.ts";

test("TripMD documents use itinerary headings, events, alerts, and frontmatter", () => {
  const parsed = parseItinerary(`---
type: tripmd
title: Example weekend
description: A neutral test itinerary.
tags: [Example, Friends]
budget: 500 EUR
currency: EUR
timezone: Europe/Lisbon
updated: 2027-05-01
---

## Before you go

- [ ] Pack

## 2027-05-14 @Europe/Lisbon

> [10:00] - [10:45] train Airport metro :: Airport - City centre
>
> - price: 2 EUR

> [!NOTE] Example
>
> Replace this itinerary with your own.
`);
  const counts = parsed.root.children.reduce<Record<string, number>>((result, node) => {
    result[node.type] = (result[node.type] ?? 0) + 1;
    return result;
  }, {});

  assert.equal(parsed.frontmatter.type, "tripmd");
  assert.equal(parsed.frontmatter.title, "Example weekend");
  assert.deepEqual(parsed.frontmatter.tags, ["Example", "Friends"]);
  assert.equal(parsed.frontmatter.updated, "2027-05-01");
  assert.equal(counts.itmdHeading, 1);
  assert.equal(counts.itmdEvent, 1);
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

test("the parser uses a supplied device timezone only when frontmatter omits one", () => {
  const body = `
## 2026-08-22

> [09:00] meeting Breakfast
`;
  const deviceFallback = parseItinerary(`---
type: tripmd
title: Device fallback
---${body}`, { defaultTimezone: "Europe/Lisbon" });
  const documentTimezone = parseItinerary(`---
type: tripmd
title: Document timezone
timezone: Asia/Tokyo
---${body}`, { defaultTimezone: "Europe/Lisbon" });
  const fallbackEvent = deviceFallback.root.children.find(
    (node): node is ItineraryEventNode => node.type === "itmdEvent",
  );
  const documentEvent = documentTimezone.root.children.find(
    (node): node is ItineraryEventNode => node.type === "itmdEvent",
  );

  assert.equal(deviceFallback.frontmatter.timezone, undefined);
  assert.equal(
    fallbackEvent?.time?.kind === "point" ? fallbackEvent.time.startISO : undefined,
    "2026-08-22T09:00+01:00",
  );
  assert.equal(documentTimezone.frontmatter.timezone, "Asia/Tokyo");
  assert.equal(
    documentEvent?.time?.kind === "point" ? documentEvent.time.startISO : undefined,
    "2026-08-22T09:00+09:00",
  );
});
