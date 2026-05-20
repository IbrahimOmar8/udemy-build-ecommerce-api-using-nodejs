'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/**
 * Udemy-style site-wide promo banner with a countdown.
 * Hardcoded to a rolling 48-hour sale for now.
 */
export default function PromoBanner() {
  const [remaining, setRemaining] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const end = new Date(now);
      const offset = now.getDay() === 0 ? 1 : 2 - (now.getDay() % 2);
      end.setDate(end.getDate() + offset);
      end.setHours(23, 59, 59, 999);
      const diff = end.getTime() - now.getTime();
      if (diff <= 0) {
        setRemaining('00:00:00');
        return;
      }
      const h = Math.floor(diff / 3600_000);
      const m = Math.floor((diff % 3600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1000);
      setRemaining(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <Link
      href="/courses?sort=-enrollmentsCount"
      className="block bg-gray-900 px-4 py-3 text-center text-sm text-white hover:bg-gray-800"
    >
      <span className="font-semibold">🎉 Flash sale — up to 80% off top courses.</span>{' '}
      <span className="ms-1 font-mono text-amber-300">Ends in {remaining}</span>
    </Link>
  );
}
