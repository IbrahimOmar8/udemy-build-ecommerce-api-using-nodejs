'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Award, BookOpen, Globe, Users } from 'lucide-react';
import { fetchCourses, fetchCategories } from '@/lib/queries';
import CourseGrid from '@/components/course/CourseGrid';

export default function HomePage() {
  const { data: topCourses } = useQuery({
    queryKey: ['courses', 'top'],
    queryFn: () => fetchCourses({ limit: 8, sort: '-enrollmentsCount' }),
  });
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 px-4 py-20 text-white">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">
            Learn anything,<br />achieve everything.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-brand-100">
            High-quality online courses from world-class instructors. Build skills with hands-on lectures,
            quizzes, assignments, and earn certificates.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/courses"
              className="rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 hover:bg-gray-100"
            >
              Browse courses
            </Link>
            <Link
              href="/register?role=instructor"
              className="rounded-md border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20"
            >
              Become an instructor
            </Link>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-6 text-sm md:grid-cols-4">
            <Stat icon={<BookOpen className="h-5 w-5" />} label="Courses" value="500+" />
            <Stat icon={<Users className="h-5 w-5" />} label="Students" value="50K+" />
            <Stat icon={<Award className="h-5 w-5" />} label="Certificates issued" value="20K+" />
            <Stat icon={<Globe className="h-5 w-5" />} label="Languages" value="10" />
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories?.data?.length ? (
        <section className="mx-auto max-w-7xl px-4 py-12">
          <h2 className="mb-6 text-2xl font-bold">Top categories</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
            {categories.data.slice(0, 12).map((c) => (
              <Link
                key={c._id}
                href={`/courses?category=${c._id}`}
                className="flex h-24 items-center justify-center rounded-md border border-gray-200 bg-white p-3 text-center text-sm font-medium text-gray-700 hover:border-brand-400 hover:text-brand-700"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Top courses */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold">Most popular courses</h2>
          <Link
            href="/courses"
            className="flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
          >
            See all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <CourseGrid courses={topCourses?.data || []} emptyMessage="No published courses yet." />
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="rounded-2xl bg-gray-900 p-10 text-white">
          <h2 className="text-3xl font-bold">Teach what you know</h2>
          <p className="mt-3 max-w-xl text-gray-300">
            Become an instructor and reach students around the world. Use our course builder, video upload,
            quizzes and assignments to build engaging learning experiences.
          </p>
          <Link
            href="/register?role=instructor"
            className="mt-6 inline-block rounded-md bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Start teaching today
          </Link>
        </div>
      </section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-md bg-white/10 p-2">{icon}</div>
      <div>
        <div className="text-xl font-bold">{value}</div>
        <div className="text-xs text-brand-100">{label}</div>
      </div>
    </div>
  );
}
