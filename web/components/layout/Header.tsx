'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BookOpen, LogOut, Search, ShoppingCart } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useT } from '@/lib/i18n/I18nProvider';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import NotificationsBell from './NotificationsBell';

export default function Header() {
  const router = useRouter();
  const { user, logout, hydrated } = useAuthStore();
  const t = useT();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onClick = () => setOpen(false);
    if (open) document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [open]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/courses?keyword=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-brand-700">
          <BookOpen className="h-6 w-6" />
          LearnHub
        </Link>

        <Link
          href="/courses"
          className="hidden text-sm text-gray-600 hover:text-gray-900 md:inline"
        >
          {t('nav.browse')}
        </Link>

        <form onSubmit={onSearch} className="flex flex-1 max-w-xl">
          <div className="flex w-full items-center rounded-md border border-gray-300 bg-white">
            <Search className="mx-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('nav.searchPlaceholder')}
              className="w-full bg-transparent px-1 py-2 text-sm focus:outline-none"
            />
          </div>
        </form>

        <LanguageSwitcher />

        <Link
          href="/cart"
          className="hidden p-2 text-gray-600 hover:text-gray-900 md:block"
          aria-label="Cart"
        >
          <ShoppingCart className="h-5 w-5" />
        </Link>

        {hydrated && !user && (
          <div className="hidden gap-2 md:flex">
            <Link
              href="/login"
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t('nav.login')}
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              {t('nav.signup')}
            </Link>
          </div>
        )}

        {hydrated && user && (
          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <NotificationsBell />
            </div>
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full bg-gray-100 px-2 py-1 text-sm hover:bg-gray-200"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="hidden text-sm md:inline">{user.name.split(' ')[0]}</span>
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-56 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                  <div className="px-3 py-2 text-xs text-gray-500">
                    {user.email}
                  </div>
                  <Link
                    href="/dashboard"
                    className="block px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    {t('nav.myLearning')}
                  </Link>
                  {user.role === 'instructor' && (
                    <Link
                      href="/instructor"
                      className="block px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      {t('nav.instructorDashboard')}
                    </Link>
                  )}
                  {user.role === 'admin' && (
                    <Link
                      href="/admin"
                      className="block px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      Admin
                    </Link>
                  )}
                  <Link
                    href="/certificates"
                    className="block px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    {t('nav.certificates')}
                  </Link>
                  <Link
                    href="/profile"
                    className="block px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    {t('nav.profile')}
                  </Link>
                  <button
                    onClick={async () => {
                      await logout();
                      router.push('/');
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-start text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    {t('nav.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
