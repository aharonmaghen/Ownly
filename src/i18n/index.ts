import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import en from './translations/en';
import he from './translations/he';

export const i18n = new I18n({ en, he });

// Detect device locale, fall back to English
const deviceLocale = getLocales()[0]?.languageCode ?? 'en';
i18n.locale = deviceLocale === 'he' ? 'he' : 'en';
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export function setLocale(locale: 'en' | 'he') {
  i18n.locale = locale;
}

export type TranslationKeys = typeof en;
