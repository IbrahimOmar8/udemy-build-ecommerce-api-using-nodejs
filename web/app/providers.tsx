'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (hydrated) {
      fetchMe();
    }
  }, [hydrated, fetchMe]);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
