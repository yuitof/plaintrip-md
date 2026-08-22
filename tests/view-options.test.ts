import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeTimezone,
  timezoneFromSearchParams,
} from "../lib/view-options.ts";

test("viewer timezone parameters accept IANA zones and reject invalid values", () => {
  assert.equal(normalizeTimezone("Asia/Tokyo"), "Asia/Tokyo");
  assert.equal(normalizeTimezone("UTC"), "UTC");
  assert.equal(normalizeTimezone("Not/A_Timezone"), undefined);
  assert.equal(normalizeTimezone(""), undefined);
  assert.equal(
    timezoneFromSearchParams({ tz: ["Europe/Lisbon", "UTC"] }),
    "Europe/Lisbon",
  );
});
