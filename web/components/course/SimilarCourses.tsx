'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import CourseCard from './CourseCard';
import type { Course, ListResponse } from '@/types';

export default function SimilarCourses({ courseId }: { courseId: string }) {
  const { data } = useQuery({
    queryKey: ['courses', courseId, 'similar'],
    queryFn: async () => {
      const res = await api.get<ListResponse<Course>>(`/courses/${courseId}/similar`);
      return res.data;
    },
    enabled: !!courseId,
  });

  if (!data?.data?.length) return null;

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold">Students also bought</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.data.slice(0, 4).map((c) => (
          <CourseCard key={c._id} course={c} />
        ))}
      </div>
    </div>
  );
}
