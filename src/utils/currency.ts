import { Currency } from '../types';

const SYMBOLS: Record<Currency, string> = {
  USD: '$',
  ILS: '₪',
  EUR: '€',
  GBP: '£',
};

export function currencySymbol(currency: Currency): string {
  return SYMBOLS[currency] ?? currency;
}

export function formatAmount(
  amount: number,
  currency: Currency,
  isRTL = false,
): string {
  const sym = currencySymbol(currency);
  const abs = Math.abs(amount).toFixed(2);
  // RTL: symbol trails the number (Hebrew convention)
  return isRTL ? `${abs} ${sym}` : `${sym}${abs}`;
}

export function formatSigned(
  amount: number,
  currency: Currency,
  isRTL = false,
): string {
  const sign = amount < 0 ? '-' : '';
  return `${sign}${formatAmount(Math.abs(amount), currency, isRTL)}`;
}
