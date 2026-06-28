import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import { Currency, Language, Settings } from '../types';
import { setLocale } from '../i18n';
import { currencySymbol } from '../utils/currency';

interface SettingsStore {
  settings: Settings;
  setLanguage: (lang: Language) => void;
  setCurrency: (currency: Currency) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: {
        language: 'en',
        currency: 'USD',
        currencySymbol: '$',
        isRTL: false,
      },

      setLanguage: (lang) => {
        const isRTL = lang === 'he';
        setLocale(lang);
        // Schedule RN RTL flip — requires app reload to fully take effect,
        // but we update the store immediately so UI reacts.
        if (I18nManager.isRTL !== isRTL) {
          I18nManager.allowRTL(isRTL);
          I18nManager.forceRTL(isRTL);
        }
        set((s) => ({
          settings: { ...s.settings, language: lang, isRTL },
        }));
      },

      setCurrency: (currency) => {
        set((s) => ({
          settings: {
            ...s.settings,
            currency,
            currencySymbol: currencySymbol(currency),
          },
        }));
      },
    }),
    {
      name: 'ownly-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
