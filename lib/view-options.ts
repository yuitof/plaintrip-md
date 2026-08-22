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

export function timezoneFromSearchParams(
  searchParams: ViewerSearchParams,
): string | undefined {
  const value = searchParams.tz;
  return normalizeTimezone(Array.isArray(value) ? value[0] : value);
}
