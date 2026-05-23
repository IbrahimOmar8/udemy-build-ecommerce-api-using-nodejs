'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, CheckCircle, ChevronLeft, FileText, Play } from 'lucide-react';
import { fetchCourse, fetchMyProgress, markLectureCompleted } from '@/lib/queries';
import VideoPlayer from '@/components/player/VideoPlayer';
import { useAuthStore } from '@/store/useAuthStore';
import { formatDuration } from '@/lib/utils';
import { api } from '@/lib/api';
import Link from 'next/link';
import BookmarksPanel from '@/components/course/BookmarksPanel';
import type { Lecture } from '@/types';

export default function LearnPage() {
  const params = useParams<{ courseId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [currentLectureId, setCurrentLectureId] = useState<string | null>(null);
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (!user && useAuthStore.getState().hydrated) {
      router.push(`/login?redirect=/learn/${params.courseId}`);
    }
  }, [user, params.courseId, router]);

  const { data: courseData } = useQuery({
    queryKey: ['course', params.courseId],
    queryFn: () => fetchCourse(params.courseId),
    enabled: !!params.courseId,
  });

  const { data: progressData } = useQuery({
    queryKey: ['course', params.courseId, 'progress'],
    queryFn: () => fetchMyProgress(params.courseId),
    enabled: !!params.courseId && !!user,
  });

  const course = courseData?.data;
  const completed = new Set(progressData?.data.completedLectures || []);

  // Pick first lecture if none selected
  useEffect(() => {
    if (course?.sections && !currentLectureId) {
      const first = progressData?.data.lastLecture
        || course.sections.flatMap((s) => s.lectures || [])[0]?._id;
      if (first) setCurrentLectureId(first);
    }
  }, [course, currentLectureId, progressData]);

  // Load lecture details
  useEffect(() => {
    if (!currentLectureId) return;
    api
      .get(`/lectures/${currentLectureId}`)
      .then((res) => setLecture(res.data.data))
      .catch(() => setLecture(null));
  }, [currentLectureId]);

  const markMut = useMutation({
    mutationFn: (lectureId: string) =>
      markLectureCompleted(params.courseId, lectureId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', params.courseId, 'progress'] });
    },
  });

  if (!course) {
    return <div className="px-4 py-10 text-gray-500">Loading course…</div>;
  }

  return (
    <div className="grid h-[calc(100vh-4rem)] grid-cols-1 lg:grid-cols-[1fr_360px]">
      {/* Player area */}
      <div className="overflow-y-auto bg-gray-900">
        <div className="p-4 lg:p-6">
          <Link
            href={`/courses/${course.slug}`}
            className="mb-4 inline-flex items-center gap-1 text-sm text-gray-300 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" /> Back to course
          </Link>

          {lecture?.type === 'video' && (
            <VideoPlayer
              src={lecture.videoUrl}
              onProgress={(t) => setCurrentTime(t)}
              onEnded={() => markMut.mutate(lecture._id)}
            />
          )}
          {lecture?.type === 'article' && (
            <div className="prose prose-invert max-w-none rounded-lg bg-gray-800 p-6 text-gray-100">
              <h2 className="mb-3 text-xl font-bold">{lecture.title}</h2>
              <div
                className="text-sm"
                dangerouslySetInnerHTML={{ __html: lecture.article || '' }}
              />
            </div>
          )}

          {lecture && (
            <div className="mt-4 rounded-lg bg-gray-800 p-4 text-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{lecture.title}</h2>
                <button
                  onClick={() => markMut.mutate(lecture._id)}
                  className="flex items-center gap-2 rounded-md bg-brand-600 px-3 py-1.5 text-sm hover:bg-brand-700"
                  disabled={completed.has(lecture._id)}
                >
                  <Check className="h-4 w-4" />
                  {completed.has(lecture._id) ? 'Completed' : 'Mark complete'}
                </button>
              </div>
              {lecture.description && (
                <p className="mt-3 text-sm text-gray-300">{lecture.description}</p>
              )}
              {lecture.attachments && lecture.attachments.length > 0 && (
                <div className="mt-4">
                  <h4 className="mb-2 text-sm font-semibold uppercase text-gray-400">
                    Attachments
                  </h4>
                  <ul className="space-y-1">
                    {lecture.attachments.map((a, i) => (
                      <li key={i}>
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-brand-300 hover:underline"
                        >
                          <FileText className="h-4 w-4" /> {a.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Bookmarks */}
          {lecture && (
            <div className="mt-4">
              <BookmarksPanel
                courseId={params.courseId}
                lectureId={lecture._id}
                currentTime={currentTime}
                onJump={(lectureId, t) => {
                  setCurrentLectureId(lectureId);
                  setTimeout(() => {
                    const v = document.querySelector('video') as HTMLVideoElement | null;
                    if (v) {
                      v.currentTime = t;
                      v.play().catch(() => {});
                    }
                  }, 300);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Curriculum sidebar */}
      <aside className="overflow-y-auto border-l border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-4">
          <h3 className="text-lg font-bold">{course.title}</h3>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-2 flex-1 rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-green-500 transition-all"
                style={{ width: `${progressData?.data.progressPercent || 0}%` }}
              />
            </div>
            <span className="text-xs text-gray-600">
              {progressData?.data.progressPercent || 0}%
            </span>
          </div>
        </div>

        {(course.sections || []).map((s) => (
          <div key={s._id} className="border-b border-gray-200">
            <h4 className="bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700">
              {s.title}
            </h4>
            <ul>
              {(s.lectures || []).map((l) => {
                const isActive = l._id === currentLectureId;
                const isDone = completed.has(l._id);
                return (
                  <li key={l._id}>
                    <button
                      onClick={() => setCurrentLectureId(l._id)}
                      className={`flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm ${
                        isActive
                          ? 'bg-brand-50 text-brand-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {isDone ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Play className="h-3 w-3 text-gray-400" />
                        )}
                        <span className="line-clamp-2">{l.title}</span>
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDuration(l.durationSeconds || 0)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </aside>
    </div>
  );
}
