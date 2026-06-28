import { useSettingsStore } from '../store/settingsStore';
import { i18n } from '../i18n';

/**
 * Returns a `t` function scoped to the current language stored in settings.
 * Re-renders automatically when language changes.
 */
export function useTranslation() {
  // Subscribe so component re-renders when language changes
  const language = useSettingsStore((s) => s.settings.language);
  i18n.locale = language;

  function t(scope: string, options?: Record<string, unknown>): string {
    return i18n.t(scope, options);
  }

  return { t, language };
}
