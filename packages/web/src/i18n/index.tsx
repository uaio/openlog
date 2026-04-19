import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Locale } from './types';
import zh from './zh';
import en from './en';

export type { Locale };
export type Lang = 'zh' | 'en';

const locales: Record<Lang, Locale> = { zh, en };

interface I18nContextValue {
  lang: Lang;
  t: Locale;
  setLang: (lang: Lang) => void;
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'zh',
  t: zh,
  setLang: () => {},
});

function detectLang(): Lang {
  const stored = localStorage.getItem('openlog-lang');
  if (stored === 'en' || stored === 'zh') return stored;
  const nav = navigator.language.toLowerCase();
  return nav.startsWith('zh') ? 'zh' : 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang);

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem('openlog-lang', newLang);
  }, []);

  const value: I18nContextValue = {
    lang,
    t: locales[lang],
    setLang,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
