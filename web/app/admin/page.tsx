'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Users, GraduationCap, BookOpenCheck, ListChecks } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';

export default function AdminHome() {
  const router = useRouter();
  const { user, hydrated } = useAuthStore();

  useEffect(() => {
    if (hydrated && (!user || user.role !== 'admin')) {
      router.push('/login?redirect=/admin');
    }
  }, [hydrated, user, router]);

  const { data: users } = useQuery({
    queryKey: ['admin', 'users-summary'],
    queryFn: async () => {
      const res = await api.get('/users', { params: { limit: 1 } });
      return res.data;
    },
    enabled: !!user && user.role === 'admin',
  });

  const { data: pendingCourses } = useQuery({
    queryKey: ['admin', 'pending-courses'],
    queryFn: async () => {
      const res = await api.get('/courses', {
        params: { status: 'pending_review', limit: 50 },
      });
      return res.data;
    },
    enabled: !!user && user.role === 'admin',
  });

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-1 flex items-center gap-2 text-3xl font-bold">
        <ShieldCheck className="h-7 w-7 text-brand-600" />
        Admin
      </h1>
      <p className="mb-8 text-sm text-gray-600">Manage the platform.</p>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card label="Users" icon={<Users className="h-5 w-5" />} value={String(users?.paginationResult?.totalDocuments || 0)} href="/admin/users" />
        <Card label="Pending courses" icon={<ListChecks className="h-5 w-5" />} value={String(pendingCourses?.paginationResult?.totalDocuments || 0)} href="/admin/courses" />
        <Card label="Instructors" icon={<GraduationCap className="h-5 w-5" />} value="—" href="/admin/instructors" />
        <Card label="Categories" icon={<BookOpenCheck className="h-5 w-5" />} value="—" href="/admin/categories" />
      </div>

      <h2 className="mb-3 text-lg font-bold">Courses awaiting review</h2>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-start font-semibold">Title</th>
              <th className="px-4 py-3 text-start font-semibold">Instructor</th>
              <th className="px-4 py-3 text-start font-semibold">Submitted</th>
              <th className="px-4 py-3 text-start font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(pendingCourses?.data || []).map((c: any) => (
              <tr key={c._id} className="border-t border-gray-200">
                <td className="px-4 py-3 font-medium">{c.title}</td>
                <td className="px-4 py-3">
                  {typeof c.instructor === 'object' ? c.instructor.name : '—'}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {new Date(c.updatedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <ReviewActions courseId={c._id} />
                </td>
              </tr>
            ))}
            {!pendingCourses?.data?.length && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-gray-500">
                  No courses awaiting review.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({
  label,
  value,
  icon,
  href,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-gray-200 bg-white p-5 transition hover:shadow"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-brand-100 p-2 text-brand-700">{icon}</div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </div>
    </Link>
  );
}

function ReviewActions({ courseId }: { courseId: string }) {
  const handle = async (decision: 'approve' | 'reject') => {
    await api.post(`/courses/${courseId}/review-decision`, { decision });
    window.location.reload();
  };
  return (
    <div className="flex gap-2">
      <button
        onClick={() => handle('approve')}
        className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
      >
        Approve
      </button>
      <button
        onClick={() => handle('reject')}
        className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
      >
        Reject
      </button>
    </div>
  );
}
