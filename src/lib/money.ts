/**
 * Monetary helpers.
 *
 * The JJS Admin API serialises all monetary/decimal fields as **strings**
 * (amount, balance, fee, spread, threshold, ...) to avoid float precision loss.
 * Parse only for display/derived math — keep the string form for round-trips.
 */

/** Parse a string amount to a number. Returns 0 for null/blank/invalid. */
export function parseAmount(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Format a string/number amount for display.
 * Crypto assets keep up to 8 dp; fiat (NGN/USD/...) uses currency-style grouping.
 */
export function formatAmount(
  value: string | number | null | undefined,
  asset?: string,
): string {
  const n = parseAmount(value);
  const fiat = new Set(["NGN", "USD", "EUR", "GBP"]);
  if (asset && fiat.has(asset.toUpperCase())) {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  }
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8,
  }).format(n);
}

/** Format an amount with its asset ticker appended, e.g. "1,000.00 NGN". */
export function formatMoney(
  value: string | number | null | undefined,
  asset?: string,
): string {
  const formatted = formatAmount(value, asset);
  return asset ? `${formatted} ${asset}` : formatted;
}
