'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Award,
  BookOpen,
  Clock,
  Globe,
  Lock,
  Play,
  ShoppingCart,
  Star,
  Users,
} from 'lucide-react';
import {
  addCourseToCart,
  enrollFree,
  fetchCourse,
  fetchCourseReviews,
} from '@/lib/queries';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';
import { formatDuration, formatPrice } from '@/lib/utils';
import { extractError } from '@/lib/api';
import { useState } from 'react';
import Link from 'next/link';
import QnaPanel from '@/components/course/QnaPanel';
import CourseIncludes from '@/components/course/CourseIncludes';
import SimilarCourses from '@/components/course/SimilarCourses';
import AnnouncementsPanel from '@/components/course/AnnouncementsPanel';
import MessageInstructorButton from '@/components/course/MessageInstructorButton';

export default function CourseDetailsPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const { data: courseData, isLoading } = useQuery({
    queryKey: ['course', params.slug],
    queryFn: () => fetchCourse(params.slug),
    enabled: !!params.slug,
  });

  const course = courseData?.data;
  const isEnrolled = courseData?.isEnrolled;

  const { data: reviewsData } = useQuery({
    queryKey: ['course', course?._id, 'reviews'],
    queryFn: () => fetchCourseReviews(course!._id),
    enabled: !!course?._id,
  });

  const enrollMut = useMutation({
    mutationFn: () => enrollFree(course!._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', params.slug] });
      setMsg({ kind: 'ok', text: 'Enrolled. Start learning now.' });
    },
    onError: (e) => setMsg({ kind: 'err', text: extractError(e) }),
  });

  const cartMut = useMutation({
    mutationFn: () => addCourseToCart(course!._id),
    onSuccess: () => setMsg({ kind: 'ok', text: 'Added to cart.' }),
    onError: (e) => setMsg({ kind: 'err', text: extractError(e) }),
  });

  if (isLoading) {
    return <div className="mx-auto max-w-7xl px-4 py-12 text-gray-500">Loading…</div>;
  }
  if (!course) {
    return <div className="mx-auto max-w-7xl px-4 py-12 text-gray-500">Course not found.</div>;
  }

  const instructorName =
    typeof course.instructor === 'object' ? course.instructor.name : 'Instructor';
  const isFreeCourse = course.isFree || (course.price ?? 0) === 0;

  const onPrimaryAction = () => {
    if (!user) {
      router.push(`/login?redirect=/courses/${params.slug}`);
      return;
    }
    if (isEnrolled) {
      router.push(`/learn/${course._id}`);
      return;
    }
    if (isFreeCourse) {
      enrollMut.mutate();
    } else {
      cartMut.mutate();
    }
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-gray-900 px-4 py-10 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[2fr_1fr]">
          <div>
            <h1 className="text-3xl font-bold">{course.title}</h1>
            {course.subtitle && (
              <p className="mt-2 text-lg text-gray-300">{course.subtitle}</p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-bold">{course.ratingsAverage?.toFixed(1) || '—'}</span>
                <span className="text-gray-400">({course.ratingsQuantity || 0} ratings)</span>
              </span>
              <span className="flex items-center gap-1 text-gray-300">
                <Users className="h-4 w-4" />
                {course.enrollmentsCount || 0} students
              </span>
              <span className="flex items-center gap-1 text-gray-300">
                <Globe className="h-4 w-4" />
                {course.language || 'English'}
              </span>
              <span className="rounded bg-gray-700 px-2 py-0.5 text-xs uppercase">
                {course.level}
              </span>
            </div>
            <p className="mt-4 text-sm text-gray-300">Created by {instructorName}</p>
          </div>

          {/* Sticky CTA card */}
          <div className="rounded-lg bg-white p-6 text-gray-900 shadow-lg">
            {course.thumbnail && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={course.thumbnail}
                alt={course.title}
                className="mb-4 w-full rounded-md object-cover aspect-video"
              />
            )}
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold">
                {formatPrice(course.discountPrice || course.price)}
              </span>
              {course.discountPrice && (
                <span className="text-lg text-gray-400 line-through">
                  {formatPrice(course.price)}
                </span>
              )}
            </div>
            <Button
              onClick={onPrimaryAction}
              loading={enrollMut.isPending || cartMut.isPending}
              className="mt-4 w-full"
              size="lg"
            >
              {isEnrolled ? (
                <>
                  <Play className="h-4 w-4" />
                  Go to course
                </>
              ) : isFreeCourse ? (
                'Enroll for free'
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  Add to cart
                </>
              )}
            </Button>
            {msg && (
              <div
                className={`mt-3 rounded-md px-3 py-2 text-sm ${
                  msg.kind === 'ok'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {msg.text}
              </div>
            )}
            <div className="mt-5">
              <CourseIncludes course={course} />
            </div>
            <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
              💰 30-day money-back guarantee
            </p>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-10">
            {course.learningOutcomes?.length ? (
              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <h2 className="mb-4 text-xl font-bold">What you&apos;ll learn</h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {course.learningOutcomes.map((o, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="mt-0.5 text-green-600">✓</span>
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Curriculum */}
            <div>
              <h2 className="mb-4 text-xl font-bold">Course content</h2>
              <div className="rounded-lg border border-gray-200 bg-white">
                {(course.sections || []).map((s, idx) => (
                  <div key={s._id} className={idx ? 'border-t border-gray-200' : ''}>
                    <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
                      <h3 className="font-semibold">{s.title}</h3>
                      <span className="text-xs text-gray-500">
                        {s.lectures?.length || 0} lectures
                      </span>
                    </div>
                    <ul>
                      {(s.lectures || []).map((l) => (
                        <li
                          key={l._id}
                          className="flex items-center justify-between px-4 py-2 text-sm text-gray-700"
                        >
                          <span className="flex items-center gap-2">
                            {l.isPreview ? (
                              <Play className="h-3 w-3 text-brand-600" />
                            ) : (
                              <Lock className="h-3 w-3 text-gray-400" />
                            )}
                            {l.title}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDuration(l.durationSeconds || 0)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {!course.sections?.length && (
                  <div className="px-4 py-6 text-sm text-gray-500">
                    No curriculum yet.
                  </div>
                )}
              </div>
            </div>

            {/* Requirements */}
            {course.requirements?.length ? (
              <div>
                <h2 className="mb-3 text-xl font-bold">Requirements</h2>
                <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
                  {course.requirements.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Description */}
            <div>
              <h2 className="mb-3 text-xl font-bold">Description</h2>
              <p className="whitespace-pre-line text-sm text-gray-700">{course.description}</p>
            </div>

            {/* Announcements */}
            <AnnouncementsPanel
              courseId={course._id}
              isOwner={
                !!user &&
                typeof course.instructor === 'object' &&
                course.instructor._id === user._id
              }
            />

            {/* Q&A */}
            <div>
              <QnaPanel courseId={course._id} />
            </div>

            {/* Similar */}
            <SimilarCourses courseId={course._id} />

            {/* Reviews */}
            <div>
              <h2 className="mb-4 text-xl font-bold">
                Reviews ({reviewsData?.results || 0})
              </h2>
              <div className="space-y-4">
                {(reviewsData?.data || []).map((r) => (
                  <div key={r._id} className="rounded-md border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold">{r.user.name}</span>
                      <span className="flex items-center gap-0.5 text-amber-400">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className="h-3 w-3"
                            fill={n <= r.ratings ? 'currentColor' : 'none'}
                          />
                        ))}
                      </span>
                    </div>
                    {r.title && <p className="mt-1 font-medium">{r.title}</p>}
                    {r.comment && <p className="mt-1 text-sm text-gray-700">{r.comment}</p>}
                  </div>
                ))}
                {!reviewsData?.data?.length && (
                  <p className="text-sm text-gray-500">No reviews yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Instructor card */}
          <aside>
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="mb-2 font-semibold">Instructor</h3>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">
                  {instructorName.charAt(0)}
                </span>
                <div>
                  <p className="font-medium">{instructorName}</p>
                  {typeof course.instructor === 'object' &&
                    course.instructor.instructorProfile?.headline && (
                      <p className="text-xs text-gray-500">
                        {course.instructor.instructorProfile.headline}
                      </p>
                    )}
                </div>
              </div>
              {typeof course.instructor === 'object' && (
                <div className="mt-3 flex flex-col gap-2">
                  <Link
                    href={`/instructors/${course.instructor._id}`}
                    className="text-sm text-brand-700 hover:underline"
                  >
                    View profile
                  </Link>
                  {user && user._id !== course.instructor._id && (
                    <MessageInstructorButton instructorId={course.instructor._id} />
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
