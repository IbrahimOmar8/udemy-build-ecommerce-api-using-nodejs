'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Locale, MESSAGES, Messages, isRtl } from './messages';

const STORAGE_KEY = 'el_locale';

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  dir: 'ltr' | 'rtl';
}

const I18nContext = createContext<I18nContextValue | null>(null);

function get(obj: Messages, key: string): string {
  return key
    .split('.')
    .reduce<any>((acc, k) => (acc && typeof acc === 'object' ? acc[k] : undefined), obj);
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = (localStorage.getItem(STORAGE_KEY) as Locale) || null;
    if (stored === 'ar' || stored === 'en') {
      setLocaleState(stored);
    } else if (typeof navigator !== 'undefined' && navigator.language.startsWith('ar')) {
      setLocaleState('ar');
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = locale;
    document.documentElement.dir = isRtl(locale) ? 'rtl' : 'ltr';
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, l);
    }
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = MESSAGES[locale];
      let value = get(dict, key);
      if (value == null) {
        value = get(MESSAGES.en, key) ?? key;
      }
      if (vars) {
        value = Object.entries(vars).reduce(
          (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v)),
          value
        );
      }
      return value;
    },
    [locale]
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t,
      dir: isRtl(locale) ? 'rtl' : 'ltr',
    }),
    [locale, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

export function useT() {
  return useI18n().t;
}
