import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import translations, { type Lang, type TranslationKey } from './translations';

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
}

const STORAGE_KEY = 'hangul-dict-lang';

function detectDefaultLang(): Lang {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'ja' || stored === 'ko') return stored;
  const browserLang = navigator.language;
  if (browserLang.startsWith('ko')) return 'ko';
  return 'ja';
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectDefaultLang);

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem(STORAGE_KEY, newLang);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback((key: TranslationKey) => {
    return translations[lang][key];
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within LanguageProvider');
  return ctx;
}
