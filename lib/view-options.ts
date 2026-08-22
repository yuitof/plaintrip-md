import { normalizeCurrency } from "./currency.ts";

export const DEVICE_TIMEZONE_COOKIE = "plaintrip-device-timezone";

export type ViewerSearchParams = Record<
  string,
  string | string[] | undefined
>;

export function normalizeTimezone(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim() || value.length > 100) {
    return undefined;
  }
  const timezone = value.trim();
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone }).format();
    return timezone;
  } catch {
    return undefined;
  }
}

export function timezoneFromCookie(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  try {
    return normalizeTimezone(decodeURIComponent(value));
  } catch {
    return undefined;
  }
}

export function currencyFromSearchParams(
  searchParams: ViewerSearchParams,
): string | undefined {
  const value = searchParams.cur;
  return normalizeCurrency(Array.isArray(value) ? value[0] : value);
}
