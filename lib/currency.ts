export const COMMON_CURRENCIES = [
  "USD",
  "EUR",
  "JPY",
  "GBP",
  "AUD",
  "CAD",
  "CHF",
  "CNY",
  "KRW",
  "SGD",
  "THB",
  "HKD",
] as const;

export type ExchangeRates = {
  base: "USD";
  rates: Record<string, number>;
  updatedAt?: number;
};

export function normalizeCurrency(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const code = value.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) return undefined;
  try {
    new Intl.NumberFormat("en", { style: "currency", currency: code }).format(1);
    return code;
  } catch {
    return undefined;
  }
}

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates?: Record<string, number>,
): number | undefined {
  if (!Number.isFinite(amount)) return undefined;
  const from = normalizeCurrency(fromCurrency);
  const to = normalizeCurrency(toCurrency);
  if (!from || !to) return undefined;
  if (from === to) return amount;
  const fromRate = rates?.[from];
  const toRate = rates?.[to];
  if (!fromRate || !toRate) return undefined;
  const result = (amount / fromRate) * toRate;
  return Number.isFinite(result) ? result : undefined;
}

export function formatCurrency(amount: number, currency: string): string {
  try {
    const options = {
      style: "currency" as const,
      currency,
      currencyDisplay: "narrowSymbol" as const,
    };
    const maximumFractionDigits = new Intl.NumberFormat(
      undefined,
      options,
    ).resolvedOptions().maximumFractionDigits;
    return new Intl.NumberFormat(undefined, {
      ...options,
      minimumFractionDigits: 0,
      maximumFractionDigits,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
}

export async function loadExchangeRates(): Promise<ExchangeRates | undefined> {
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 43_200 },
    });
    if (!response.ok) return undefined;
    const payload = (await response.json()) as {
      result?: string;
      base_code?: string;
      rates?: Record<string, unknown>;
      time_last_update_unix?: number;
    };
    if (
      payload.result !== "success" ||
      payload.base_code !== "USD" ||
      !payload.rates
    ) {
      return undefined;
    }
    const rates: Record<string, number> = {};
    for (const [currency, value] of Object.entries(payload.rates)) {
      if (/^[A-Z]{3}$/.test(currency) && typeof value === "number" && value > 0) {
        rates[currency] = value;
      }
    }
    if (rates.USD !== 1) return undefined;
    return {
      base: "USD",
      rates,
      updatedAt: payload.time_last_update_unix,
    };
  } catch {
    return undefined;
  }
}
