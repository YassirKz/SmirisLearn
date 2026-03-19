import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Imports des traductions
import frCommon from './locales/fr/common.json';
import frAuth from './locales/fr/auth.json';
import frAdmin from './locales/fr/admin.json';
import frStudent from './locales/fr/student.json';

import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enAdmin from './locales/en/admin.json';
import enStudent from './locales/en/student.json';

import deCommon from './locales/de/common.json';
import deAuth from './locales/de/auth.json';
import deAdmin from './locales/de/admin.json';
import deStudent from './locales/de/student.json';

import arCommon from './locales/ar/common.json';
import arAuth from './locales/ar/auth.json';
import arAdmin from './locales/ar/admin.json';
import arStudent from './locales/ar/student.json';

const resources = {
  fr: {
    common: frCommon,
    auth: frAuth,
    admin: frAdmin,
    student: frStudent,
  },
  en: {
    common: enCommon,
    auth: enAuth,
    admin: enAdmin,
    student: enStudent,
  },
  de: {
    common: deCommon,
    auth: deAuth,
    admin: deAdmin,
    student: deStudent,
  },
  ar: {
    common: arCommon,
    auth: arAuth,
    admin: arAdmin,
    student: arStudent,
  },
};

i18n
  .use(LanguageDetector) // détecte la langue du navigateur
  .use(initReactI18next) // passe l'instance à react-i18next
  .init({
    resources,
    fallbackLng: 'en', // langue par défaut si la détection échoue
    debug: process.env.NODE_ENV === 'development', // logs en dev
    interpolation: {
      escapeValue: false, // déjà protégé par React
    },
    // Namespaces par défaut
    defaultNS: 'common',
    ns: ['common', 'auth', 'admin', 'student'],
  });

// Fonction pour changer la direction RTL quand la langue est arabe
i18n.on('languageChanged', (lng) => {
  if (lng === 'ar') {
    document.documentElement.dir = 'rtl';
    document.documentElement.classList.add('rtl');
  } else {
    document.documentElement.dir = 'ltr';
    document.documentElement.classList.remove('rtl');
  }
});

export default i18n;