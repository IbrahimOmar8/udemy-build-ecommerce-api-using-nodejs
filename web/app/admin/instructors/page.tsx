'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

export default function AdminInstructors() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, hydrated } = useAuthStore();

  useEffect(() => {
    if (hydrated && (!user || user.role !== 'admin')) router.push('/');
  }, [hydrated, user, router]);

  const { data } = useQuery({
    queryKey: ['admin', 'instructors-pending'],
    queryFn: async () => {
      const res = await api.get('/users', {
        params: { role: 'instructor', 'instructorProfile.approved': false, limit: 100 },
      });
      return res.data;
    },
    enabled: !!user && user.role === 'admin',
  });

  const approve = useMutation({
    mutationFn: (id: string) => api.post(`/instructors/${id}/approve`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin', 'instructors-pending'] }),
  });

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Pending instructor approvals</h1>
      <div className="space-y-3">
        {(data?.data || []).map((u: any) => (
          <div
            key={u._id}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4"
          >
            <div>
              <h3 className="font-semibold">{u.name}</h3>
              <p className="text-sm text-gray-500">{u.email}</p>
              {u.instructorProfile?.headline && (
                <p className="mt-1 text-xs text-gray-600">{u.instructorProfile.headline}</p>
              )}
            </div>
            <button
              onClick={() => approve.mutate(u._id)}
              disabled={approve.isPending}
              className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              Approve
            </button>
          </div>
        ))}
        {!data?.data?.length && (
          <p className="rounded-md border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
            No pending instructors.
          </p>
        )}
      </div>
    </div>
  );
}
