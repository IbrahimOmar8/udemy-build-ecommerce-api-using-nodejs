'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, DollarSign, PlusCircle, Star, Users } from 'lucide-react';
import {
  fetchInstructorCourses,
  fetchInstructorDashboard,
} from '@/lib/queries';
import { useAuthStore } from '@/store/useAuthStore';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export default function InstructorDashboardPage() {
  const router = useRouter();
  const { user, hydrated } = useAuthStore();

  useEffect(() => {
    if (hydrated && (!user || user.role !== 'instructor')) {
      router.push('/login?redirect=/instructor');
    }
  }, [hydrated, user, router]);

  const { data: dashData } = useQuery({
    queryKey: ['instructor', 'dashboard'],
    queryFn: fetchInstructorDashboard,
    enabled: !!user && user.role === 'instructor',
  });

  const { data: coursesData } = useQuery({
    queryKey: ['instructor', 'courses'],
    queryFn: fetchInstructorCourses,
    enabled: !!user && user.role === 'instructor',
  });

  if (!user || user.role !== 'instructor') return null;
  const stats = dashData?.data || {};

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Instructor dashboard</h1>
          <p className="text-sm text-gray-600">Manage your courses and track performance.</p>
        </div>
        <Link href="/instructor/courses/new">
          <Button>
            <PlusCircle className="h-4 w-4" />
            New course
          </Button>
        </Link>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard
          icon={<BookOpen className="h-5 w-5" />}
          label="Total courses"
          value={String(stats.totalCourses || 0)}
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Students"
          value={String(stats.totalStudents || 0)}
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Revenue"
          value={formatPrice(stats.totalRevenue || 0)}
        />
        <StatCard
          icon={<Star className="h-5 w-5" />}
          label="Average rating"
          value={(stats.averageRating || 0).toFixed(1)}
        />
      </div>

      <h2 className="mb-4 text-xl font-bold">My courses</h2>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Title</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-left font-semibold">Students</th>
              <th className="px-4 py-3 text-left font-semibold">Rating</th>
              <th className="px-4 py-3 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(coursesData?.data || []).map((c) => (
              <tr key={c._id} className="border-t border-gray-200">
                <td className="px-4 py-3 font-medium">{c.title}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={c.status} />
                </td>
                <td className="px-4 py-3">{c.enrollmentsCount || 0}</td>
                <td className="px-4 py-3">{c.ratingsAverage?.toFixed(1) || '—'}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/instructor/courses/${c._id}/edit`}
                    className="text-brand-700 hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {!coursesData?.data?.length && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                  You haven&apos;t created any courses yet.{' '}
                  <Link href="/instructor/courses/new" className="text-brand-700 hover:underline">
                    Create your first course
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-brand-100 p-2 text-brand-700">{icon}</div>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    pending_review: 'bg-amber-100 text-amber-700',
    published: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    archived: 'bg-gray-100 text-gray-500',
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[status] || 'bg-gray-100'}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}
