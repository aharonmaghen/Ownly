import { useSettingsStore } from '../store/settingsStore';
import { formatAmount, formatSigned } from '../utils/currency';

export function useCurrency() {
  const { currency, isRTL } = useSettingsStore((s) => s.settings);

  return {
    currency,
    format: (amount: number) => formatAmount(amount, currency, isRTL),
    formatSigned: (amount: number) => formatSigned(amount, currency, isRTL),
  };
}
