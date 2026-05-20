'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

export default function AdminUsers() {
  const router = useRouter();
  const { user, hydrated } = useAuthStore();

  useEffect(() => {
    if (hydrated && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [hydrated, user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const res = await api.get('/users', { params: { limit: 100 } });
      return res.data;
    },
    enabled: !!user && user.role === 'admin',
  });

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">All users</h1>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-start font-semibold">Name</th>
              <th className="px-4 py-3 text-start font-semibold">Email</th>
              <th className="px-4 py-3 text-start font-semibold">Role</th>
              <th className="px-4 py-3 text-start font-semibold">Active</th>
              <th className="px-4 py-3 text-start font-semibold">Joined</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : (
              (data?.data || []).map((u: any) => (
                <tr key={u._id} className="border-t border-gray-200">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-gray-700">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : u.role === 'instructor'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {u.active ? (
                      <span className="text-green-600">●</span>
                    ) : (
                      <span className="text-gray-400">○</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
