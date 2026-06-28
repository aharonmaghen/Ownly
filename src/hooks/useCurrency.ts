import { useSettingsStore } from '../store/settingsStore';
import { formatAmount, formatSigned } from '../utils/currency';

export function useCurrency() {
  const currency = useSettingsStore((s) => s.settings.currency);

  return {
    currency,
    format: (amount: number) => formatAmount(amount, currency),
    formatSigned: (amount: number) => formatSigned(amount, currency),
  };
}
