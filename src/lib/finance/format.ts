import type { CurrencyCode, Money } from "./models";

const LOCALE = "en-US";

export function formatMoney(
  money: Money,
  opts: { signed?: boolean; compact?: boolean; decimals?: boolean } = {},
) {
  const { signed = false, compact = false, decimals = Math.abs(money.value) % 1 !== 0 } = opts;
  const formatted = new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: money.currencyCode,
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
    notation: compact ? "compact" : "standard",
  }).format(Math.abs(money.value));
  if (money.value < 0) return `−${formatted}`;
  return signed ? `+${formatted}` : formatted;
}

export function formatAmountValue(value: number, currencyCode: CurrencyCode, signed = false) {
  return formatMoney({ value, currencyCode }, { signed });
}

export function money(value: number, currencyCode: CurrencyCode): Money {
  return { value: Math.round(value * 100) / 100, currencyCode };
}

/** Currencies never mix by plain arithmetic — callers must group first. */
export function sumMoney(items: Money[], currencyCode: CurrencyCode): Money {
  const total = items
    .filter((m) => m.currencyCode === currencyCode)
    .reduce((s, m) => s + m.value, 0);
  return money(total, currencyCode);
}

export function groupCurrencies(items: Money[]): Money[] {
  const codes = [...new Set(items.map((m) => m.currencyCode))];
  return codes.map((code) => sumMoney(items, code));
}

export function percent(part: number, whole: number) {
  if (!whole) return 0;
  return Math.round((part / whole) * 100);
}
