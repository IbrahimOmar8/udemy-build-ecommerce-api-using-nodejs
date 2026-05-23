'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Award, BookOpen, Play } from 'lucide-react';
import { fetchMyCertificates, fetchMyEnrollments } from '@/lib/queries';
import { useAuthStore } from '@/store/useAuthStore';
import { formatDuration } from '@/lib/utils';
import RefundButton from '@/components/course/RefundButton';
import StreakCard from '@/components/course/StreakCard';
import type { Course, Enrollment } from '@/types';

export default function StudentDashboardPage() {
  const router = useRouter();
  const { user, hydrated } = useAuthStore();

  useEffect(() => {
    if (hydrated && !user) router.push('/login?redirect=/dashboard');
  }, [hydrated, user, router]);

  const { data: enrollments } = useQuery({
    queryKey: ['enrollments', 'me'],
    queryFn: fetchMyEnrollments,
    enabled: !!user,
  });

  const { data: certs } = useQuery({
    queryKey: ['certificates', 'me'],
    queryFn: fetchMyCertificates,
    enabled: !!user,
  });

  if (!user) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-1 text-3xl font-bold">Welcome back, {user.name.split(' ')[0]}</h1>
      <p className="mb-8 text-sm text-gray-600">Pick up where you left off.</p>

      <div className="mb-6">
        <StreakCard />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-10">
        <StatCard
          icon={<BookOpen className="h-5 w-5" />}
          label="Enrolled courses"
          value={String(enrollments?.results || 0)}
        />
        <StatCard
          icon={<Award className="h-5 w-5" />}
          label="Certificates"
          value={String(certs?.results || 0)}
        />
        <StatCard
          icon={<Play className="h-5 w-5" />}
          label="In progress"
          value={String(
            (enrollments?.data || []).filter((e) => e.progressPercent < 100).length
          )}
        />
      </div>

      <h2 className="mb-4 text-xl font-bold">My courses</h2>
      <div className="space-y-3">
        {(enrollments?.data || []).map((e: Enrollment) => {
          const c = e.course as Course;
          return (
            <Link
              key={e._id}
              href={`/learn/${c._id}`}
              className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 transition hover:shadow"
            >
              {c.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.thumbnail}
                  alt={c.title}
                  className="h-20 w-32 rounded object-cover"
                />
              ) : (
                <div className="flex h-20 w-32 items-center justify-center rounded bg-gray-100 text-2xl font-bold text-gray-400">
                  {c.title?.charAt(0)}
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold">{c.title}</h3>
                <p className="text-xs text-gray-500">
                  {formatDuration(c.totalDurationSeconds || 0)} • {c.totalLectures} lectures
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 max-w-xs rounded-full bg-gray-200">
                    <div
                      className="h-1.5 rounded-full bg-green-500"
                      style={{ width: `${e.progressPercent}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">{e.progressPercent}%</span>
                </div>
                <div className="mt-2">
                  <RefundButton enrollmentId={e._id} />
                </div>
              </div>
              <Play className="h-5 w-5 text-brand-600" />
            </Link>
          );
        })}
        {!enrollments?.data?.length && (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
            <p className="text-sm text-gray-500">You are not enrolled in any course yet.</p>
            <Link
              href="/courses"
              className="mt-3 inline-block rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Browse courses
            </Link>
          </div>
        )}
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
