'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, PlusCircle, Send, Trash2 } from 'lucide-react';
import {
  createLecture,
  createSection,
  fetchCourse,
  publishCourse,
} from '@/lib/queries';
import { api, extractError } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import SortableList from '@/components/builder/SortableList';
import AiAssistant from '@/components/builder/AiAssistant';

export default function EditCoursePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, hydrated } = useAuthStore();
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && (!user || user.role !== 'instructor')) {
      router.push('/login');
    }
  }, [hydrated, user, router]);

  const { data: courseData } = useQuery({
    queryKey: ['course', params.id],
    queryFn: () => fetchCourse(params.id),
    enabled: !!params.id,
  });
  const course = courseData?.data;

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ['course', params.id] });

  const [newSectionTitle, setNewSectionTitle] = useState('');
  const addSectionMut = useMutation({
    mutationFn: () => createSection(params.id, { title: newSectionTitle }),
    onSuccess: () => {
      setNewSectionTitle('');
      refresh();
    },
    onError: (e) => setMsg(extractError(e)),
  });

  const deleteSectionMut = useMutation({
    mutationFn: (id: string) => api.delete(`/sections/${id}`),
    onSuccess: refresh,
  });
  const deleteLectureMut = useMutation({
    mutationFn: (id: string) => api.delete(`/lectures/${id}`),
    onSuccess: refresh,
  });

  const publishMut = useMutation({
    mutationFn: () => publishCourse(params.id),
    onSuccess: () => {
      refresh();
      setMsg('Course submitted for publication.');
    },
    onError: (e) => setMsg(extractError(e)),
  });

  const reorderSectionsMut = useMutation({
    mutationFn: (order: { id: string; order: number }[]) =>
      api.put(`/courses/${params.id}/sections/reorder`, { order }),
    onSuccess: refresh,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{course?.title || 'Edit course'}</h1>
          <p className="text-sm text-gray-600">
            Status: <span className="font-medium">{course?.status}</span>
          </p>
        </div>
        <Button onClick={() => publishMut.mutate()} loading={publishMut.isPending}>
          <Send className="h-4 w-4" />
          {course?.status === 'published' ? 'Re-publish' : 'Publish'}
        </Button>
      </div>

      {msg && (
        <div className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">{msg}</div>
      )}

      {course && (
        <div className="mb-6">
          <AiAssistant
            title={course.title}
            description={course.description}
            level={course.level}
            onOutline={async (data) => {
              for (let i = 0; i < (data.sections || []).length; i++) {
                const s = data.sections[i];
                try {
                  const created = await api.post(
                    `/courses/${params.id}/sections`,
                    { title: s.title, description: s.description, order: i }
                  );
                  for (const l of s.lectures || []) {
                    const form = new FormData();
                    form.append('title', l.title);
                    form.append('type', 'video');
                    form.append('durationSeconds', String((l.estimatedMinutes || 0) * 60));
                    await api.post(
                      `/sections/${created.data.data._id}/lectures`,
                      form,
                      { headers: { 'Content-Type': 'multipart/form-data' } }
                    );
                  }
                } catch (e) {
                  /* continue */
                }
              }
              refresh();
              setMsg('Curriculum draft added — review and edit each section.');
            }}
          />
        </div>
      )}

      {/* Sections (drag to reorder) */}
      <SortableList
        items={(course?.sections || []).map((s: any) => ({ ...s, id: s._id }))}
        onReorder={(reordered) =>
          reorderSectionsMut.mutate(
            reordered.map((s, i) => ({ id: s._id, order: i }))
          )
        }
        renderItem={(s: any) => (
          <SectionEditor
            section={s}
            index={(course?.sections || []).findIndex((x: any) => x._id === s._id)}
            courseId={params.id}
            onRefresh={refresh}
            onDeleteSection={() => deleteSectionMut.mutate(s._id)}
            onDeleteLecture={(id) => deleteLectureMut.mutate(id)}
          />
        )}
      />

      {/* Add section */}
      <div className="mt-6 flex gap-2 rounded-lg border border-dashed border-gray-300 bg-white p-4">
        <Input
          placeholder="New section title…"
          value={newSectionTitle}
          onChange={(e) => setNewSectionTitle(e.target.value)}
        />
        <Button
          onClick={() => addSectionMut.mutate()}
          loading={addSectionMut.isPending}
          disabled={!newSectionTitle.trim()}
        >
          <PlusCircle className="h-4 w-4" />
          Add section
        </Button>
      </div>
    </div>
  );
}

interface SectionEditorProps {
  section: any;
  index: number;
  courseId: string;
  onRefresh: () => void;
  onDeleteSection: () => void;
  onDeleteLecture: (id: string) => void;
}

function SectionEditor({
  section,
  index,
  courseId,
  onRefresh,
  onDeleteSection,
  onDeleteLecture,
}: SectionEditorProps) {
  const [open, setOpen] = useState(true);
  const [adding, setAdding] = useState(false);

  const reorderLecturesMut = useMutation({
    mutationFn: (order: { id: string; order: number }[]) =>
      api.put(`/sections/${section._id}/lectures/reorder`, { order }),
    onSuccess: onRefresh,
  });

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-left"
        >
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          <span className="font-semibold">
            Section {index + 1}: {section.title}
          </span>
        </button>
        <button
          onClick={onDeleteSection}
          className="text-red-600 hover:text-red-800"
          aria-label="Delete section"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {open && (
        <div className="p-4">
          <div className="mb-3">
            <SortableList
              items={(section.lectures || []).map((l: any) => ({ ...l, id: l._id }))}
              onReorder={(reordered) =>
                reorderLecturesMut.mutate(
                  reordered.map((l, i) => ({ id: l._id, order: i }))
                )
              }
              renderItem={(l: any) => (
                <div className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm">
                  <span>
                    <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs uppercase">
                      {l.type}
                    </span>{' '}
                    {l.title}
                  </span>
                  <button
                    onClick={() => onDeleteLecture(l._id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            />
          </div>

          {adding ? (
            <AddLectureForm
              sectionId={section._id}
              onDone={() => {
                setAdding(false);
                onRefresh();
              }}
              onCancel={() => setAdding(false)}
            />
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="text-sm text-brand-700 hover:underline"
            >
              + Add lecture
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function AddLectureForm({
  sectionId,
  onDone,
  onCancel,
}: {
  sectionId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'video' | 'article'>('video');
  const [article, setArticle] = useState('');
  const [video, setVideo] = useState<File | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [isPreview, setIsPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: async () => {
      const form = new FormData();
      form.append('title', title);
      form.append('type', type);
      if (isPreview) form.append('isPreview', 'true');
      if (type === 'article') form.append('article', article);
      if (type === 'video') {
        form.append('durationSeconds', String(duration));
        if (video) form.append('video', video);
      }
      return createLecture(sectionId, form);
    },
    onSuccess: onDone,
    onError: (e) => setError(extractError(e)),
  });

  return (
    <div className="space-y-3 rounded-md border border-gray-200 bg-gray-50 p-3">
      <Input
        placeholder="Lecture title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className="flex gap-2 text-sm">
        <label className="flex items-center gap-1">
          <input
            type="radio"
            checked={type === 'video'}
            onChange={() => setType('video')}
          />
          Video
        </label>
        <label className="flex items-center gap-1">
          <input
            type="radio"
            checked={type === 'article'}
            onChange={() => setType('article')}
          />
          Article
        </label>
        <label className="ml-auto flex items-center gap-1">
          <input
            type="checkbox"
            checked={isPreview}
            onChange={(e) => setIsPreview(e.target.checked)}
          />
          Preview lecture
        </label>
      </div>

      {type === 'video' ? (
        <>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setVideo(e.target.files?.[0] || null)}
            className="text-sm"
          />
          <Input
            type="number"
            placeholder="Duration in seconds"
            value={duration || ''}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
        </>
      ) : (
        <textarea
          placeholder="Article HTML / Markdown"
          rows={5}
          value={article}
          onChange={(e) => setArticle(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Button onClick={() => mut.mutate()} loading={mut.isPending} disabled={!title}>
          Add lecture
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
