'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Award, ExternalLink } from 'lucide-react';
import { fetchMyCertificates } from '@/lib/queries';
import { useAuthStore } from '@/store/useAuthStore';

export default function CertificatesPage() {
  const router = useRouter();
  const { user, hydrated } = useAuthStore();

  useEffect(() => {
    if (hydrated && !user) router.push('/login?redirect=/certificates');
  }, [hydrated, user, router]);

  const { data } = useQuery({
    queryKey: ['certificates', 'me'],
    queryFn: fetchMyCertificates,
    enabled: !!user,
  });

  if (!user) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">My certificates</h1>
      {!data?.data?.length ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
          You don&apos;t have any certificates yet. Complete a course to earn one.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.data.map((c: any) => (
            <div
              key={c._id}
              className="rounded-lg border border-gray-200 bg-white p-5"
            >
              <Award className="h-8 w-8 text-amber-500" />
              <h3 className="mt-2 font-bold">{c.course?.title}</h3>
              <p className="text-xs text-gray-500">Serial: {c.serial}</p>
              <p className="text-xs text-gray-500">
                Issued: {new Date(c.issuedAt).toLocaleDateString()}
              </p>
              <div className="mt-3 flex gap-2">
                {c.fileUrl && (
                  <a
                    href={c.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-brand-700 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" /> View
                  </a>
                )}
                {c.verifyUrl && (
                  <a
                    href={c.verifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-brand-700 hover:underline"
                  >
                    Verify
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
