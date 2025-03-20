import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Import translation files
import en from './en.json';
import ms from './ms.json';
import zhs from './zhs.json';
import zht from './zht.json';

// Configure i18next
i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources: {
      en: { translation: en },
      ms: { translation: ms },
      zhs: { translation: zhs },
      zht: { translation: zht }
    },
    lng: Localization.locale.split('-')[0], // Use device language by default
    fallbackLng: 'en', // Fallback to English if translation not available
    interpolation: {
      escapeValue: false // React already escapes values
    }
  });

export default i18n;