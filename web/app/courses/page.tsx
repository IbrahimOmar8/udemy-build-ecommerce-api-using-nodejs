'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { fetchCategories, fetchCourses } from '@/lib/queries';
import CourseGrid from '@/components/course/CourseGrid';

export default function CoursesCatalogPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-8 text-gray-500">Loading…</div>}>
      <CoursesCatalogContent />
    </Suspense>
  );
}

function CoursesCatalogContent() {
  const params = useSearchParams();
  const router = useRouter();
  const keyword = params.get('keyword') || '';
  const level = params.get('level') || '';
  const category = params.get('category') || '';
  const sort = params.get('sort') || '-createdAt';

  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [keyword, level, category, sort]);

  const { data, isLoading } = useQuery({
    queryKey: ['courses', { keyword, level, category, sort, page }],
    queryFn: () =>
      fetchCourses({
        keyword: keyword || undefined,
        level: level || undefined,
        category: category || undefined,
        sort,
        page,
        limit: 12,
      }),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const setParam = (key: string, val: string) => {
    const sp = new URLSearchParams(params);
    if (val) sp.set(key, val);
    else sp.delete(key);
    router.push(`/courses?${sp.toString()}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">
        {keyword ? `Results for "${keyword}"` : 'All courses'}
      </h1>
      <p className="mb-6 text-sm text-gray-600">
        {data?.paginationResult?.totalDocuments ?? 0} courses
      </p>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
        {/* Filters sidebar */}
        <aside className="space-y-6">
          <FilterGroup
            title="Level"
            options={[
              { value: '', label: 'All levels' },
              { value: 'beginner', label: 'Beginner' },
              { value: 'intermediate', label: 'Intermediate' },
              { value: 'advanced', label: 'Advanced' },
            ]}
            value={level}
            onChange={(v) => setParam('level', v)}
          />
          <FilterGroup
            title="Category"
            options={[
              { value: '', label: 'All' },
              ...(categories?.data || []).map((c) => ({ value: c._id, label: c.name })),
            ]}
            value={category}
            onChange={(v) => setParam('category', v)}
          />
          <FilterGroup
            title="Sort"
            options={[
              { value: '-createdAt', label: 'Newest' },
              { value: '-ratingsAverage', label: 'Top rated' },
              { value: '-enrollmentsCount', label: 'Most popular' },
              { value: 'price', label: 'Price: low to high' },
              { value: '-price', label: 'Price: high to low' },
            ]}
            value={sort}
            onChange={(v) => setParam('sort', v)}
          />
        </aside>

        <div>
          {isLoading ? (
            <div className="rounded-lg bg-white p-12 text-center text-gray-500">Loading…</div>
          ) : (
            <CourseGrid courses={data?.data || []} />
          )}

          {data?.paginationResult && data.paginationResult.numberOfPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {data.paginationResult.numberOfPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.paginationResult.numberOfPages}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold uppercase text-gray-500">{title}</h3>
      <ul className="space-y-1">
        {options.map((opt) => (
          <li key={opt.value}>
            <button
              onClick={() => onChange(opt.value)}
              className={`w-full rounded-md px-2 py-1 text-left text-sm transition ${
                value === opt.value
                  ? 'bg-brand-50 font-medium text-brand-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {opt.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
