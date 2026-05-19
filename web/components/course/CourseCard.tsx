import Link from 'next/link';
import { Star, Users } from 'lucide-react';
import type { Course } from '@/types';
import { formatPrice, formatDuration } from '@/lib/utils';

interface Props {
  course: Course;
}

export default function CourseCard({ course }: Props) {
  const instructorName =
    typeof course.instructor === 'object' ? course.instructor.name : 'Instructor';
  const slugOrId = course.slug || course._id;
  return (
    <Link
      href={`/courses/${slugOrId}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition hover:shadow-lg"
    >
      <div className="relative aspect-video bg-gray-100">
        {course.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.thumbnail}
            alt={course.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-gray-300">
            {course.title.charAt(0)}
          </div>
        )}
        {course.discountPrice ? (
          <span className="absolute right-2 top-2 rounded bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
            -{Math.round(((course.price - course.discountPrice) / course.price) * 100)}%
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-semibold text-gray-900 group-hover:text-brand-700">
          {course.title}
        </h3>
        <p className="mt-1 text-sm text-gray-600">{instructorName}</p>
        <div className="mt-2 flex items-center gap-2 text-sm">
          <span className="font-bold text-amber-500">
            {course.ratingsAverage?.toFixed(1) || '—'}
          </span>
          <div className="flex items-center text-amber-400">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className="h-3 w-3"
                fill={n <= Math.round(course.ratingsAverage || 0) ? 'currentColor' : 'none'}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">({course.ratingsQuantity || 0})</span>
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {course.enrollmentsCount || 0}
          </span>
          <span>{formatDuration(course.totalDurationSeconds)}</span>
          <span>{course.totalLectures} lectures</span>
        </div>
        <div className="mt-auto flex items-center gap-2 pt-3">
          <span className="text-lg font-bold text-gray-900">
            {formatPrice(course.discountPrice || course.price)}
          </span>
          {course.discountPrice ? (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(course.price)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
