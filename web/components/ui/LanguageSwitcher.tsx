'use client';

import { useI18n } from '@/lib/i18n/I18nProvider';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  return (
    <button
      onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
      className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
      aria-label="Switch language"
    >
      <Globe className="h-4 w-4" />
      <span className="font-medium">{locale === 'en' ? 'AR' : 'EN'}</span>
    </button>
  );
}
