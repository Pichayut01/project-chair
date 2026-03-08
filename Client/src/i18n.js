import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationEN from './locales/en/translation.json';
import translationTH from './locales/th/translation.json';

// the translations
const resources = {
    en: {
        translation: translationEN
    },
    th: {
        translation: translationTH
    }
};

// Get saved language from localStorage or default to 'en'
const savedLanguage = localStorage.getItem('appLanguage') || 'en';

i18n
    .use(initReactI18next) // passes i18n down to react-i18next
    .init({
        resources,
        lng: savedLanguage, // language to use
        fallbackLng: 'en', // use en if detected lng is not available

        interpolation: {
            escapeValue: false // react already safes from xss
        }
    });

export default i18n;
