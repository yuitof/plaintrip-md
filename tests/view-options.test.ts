import assert from "node:assert/strict";
import test from "node:test";
import {
  currencyFromSearchParams,
  normalizeTimezone,
  timezoneFromCookie,
} from "../lib/view-options.ts";
import {
  convertCurrency,
  formatCurrency,
  normalizeCurrency,
} from "../lib/currency.ts";

test("viewer timezone values accept IANA zones and reject invalid values", () => {
  assert.equal(normalizeTimezone("Asia/Tokyo"), "Asia/Tokyo");
  assert.equal(normalizeTimezone("UTC"), "UTC");
  assert.equal(normalizeTimezone("Not/A_Timezone"), undefined);
  assert.equal(normalizeTimezone(""), undefined);
  assert.equal(timezoneFromCookie("Europe%2FLisbon"), "Europe/Lisbon");
  assert.equal(timezoneFromCookie("%E0%A4%A"), undefined);
});

test("viewer currencies normalize and convert through USD-based rates", () => {
  const rates = { USD: 1, EUR: 0.8, JPY: 160 };
  assert.equal(normalizeCurrency(" eur "), "EUR");
  assert.equal(normalizeCurrency("EURO"), undefined);
  assert.equal(currencyFromSearchParams({ cur: "jpy" }), "JPY");
  assert.equal(convertCurrency(80, "EUR", "USD", rates), 100);
  assert.equal(convertCurrency(80, "EUR", "JPY", rates), 16_000);
  assert.equal(convertCurrency(80, "EUR", "CAD", rates), undefined);
  assert.doesNotMatch(formatCurrency(1_234.56, "JPY"), /[.,]56/);
  assert.doesNotMatch(formatCurrency(10, "USD"), /[.,]00/);
});
