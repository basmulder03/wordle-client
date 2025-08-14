import i18n from 'i18next';
import {initReactI18next} from "react-i18next";

import en from './locales/en.json';
import nl from './locales/nl.json';

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: {translation: en},
            nl: {translation: nl}
        },
        lng: localStorage.getItem('prefs.language') || 'en',
        fallbackLng: 'en',
        interpolation: {escapeValue: false}
    }).then(r => console.debug('i18n initialized', r));

export default i18n;