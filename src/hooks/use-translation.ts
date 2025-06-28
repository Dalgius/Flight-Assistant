"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect, createElement } from 'react';
import { translations } from '@/lib/i18n';

type Language = 'en' | 'it';

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, options?: { [key: string]: string | number }) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('flightPlannerLang') as Language | null;
    let initialLang: Language = 'en';

    if (savedLang && translations[savedLang]) {
      initialLang = savedLang;
    } else {
        const browserLang = typeof navigator !== 'undefined' ? navigator.language.split('-')[0] as Language : 'en';
        if(translations[browserLang]){
            initialLang = browserLang;
        }
    }
    setLanguageState(initialLang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = initialLang;
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    if (translations[lang]) {
      localStorage.setItem('flightPlannerLang', lang);
      setLanguageState(lang);
      document.documentElement.lang = lang;
    }
  }, []);

  const t = useCallback((key: string, options: { [key: string]: string | number } = {}) => {
    let text = (translations[language] && translations[language][key])
               || (translations['en'] && translations['en'][key])
               || `[${key}]`;

    for (const placeholder in options) {
        text = text.replace(new RegExp(`{${placeholder}}`, 'g'), String(options[placeholder]));
    }
    return text;
  }, [language]);

  const providerValue = { language, setLanguage, t };

  return createElement(
    TranslationContext.Provider,
    { value: providerValue },
    children
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
