import CourseCard from './CourseCard';
import type { Course } from '@/types';

interface Props {
  courses: Course[];
  emptyMessage?: string;
}

export default function CourseGrid({ courses, emptyMessage }: Props) {
  if (!courses?.length) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
        {emptyMessage || 'No courses found.'}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {courses.map((c) => (
        <CourseCard key={c._id} course={c} />
      ))}
    </div>
  );
}
