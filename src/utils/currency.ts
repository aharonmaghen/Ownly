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

export function formatAmount(amount: number, currency: Currency): string {
  const sym = currencySymbol(currency);
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const sign = amount < 0 ? '-' : '';
  return `${sign}${sym}${formatted}`;
}

export function formatSigned(amount: number, currency: Currency): string {
  return formatAmount(amount, currency);
}
