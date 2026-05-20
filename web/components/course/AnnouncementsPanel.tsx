'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Pin, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { formatRelativeTime } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';

interface Announcement {
  _id: string;
  title: string;
  body: string;
  pinned: boolean;
  createdAt: string;
  instructor: { _id: string; name: string; profileImg?: string };
}

interface Props {
  courseId: string;
  isOwner: boolean;
}

export default function AnnouncementsPanel({ courseId, isOwner }: Props) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data } = useQuery({
    queryKey: ['announcements', courseId],
    queryFn: async () => {
      const res = await api.get<{ results: number; data: Announcement[] }>(
        `/courses/${courseId}/announcements`
      );
      return res.data;
    },
    enabled: !!courseId,
  });

  const createMut = useMutation({
    mutationFn: (payload: { title: string; body: string }) =>
      api.post(`/courses/${courseId}/announcements`, payload),
    onSuccess: () => {
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['announcements', courseId] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/announcements/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['announcements', courseId] }),
  });

  const pinMut = useMutation({
    mutationFn: (id: string) => api.patch(`/announcements/${id}/pin`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['announcements', courseId] }),
  });

  if (!data?.data?.length && !isOwner) return null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <Megaphone className="h-5 w-5 text-brand-600" />
          Announcements
        </h2>
        {isOwner && (
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : 'New announcement'}
          </Button>
        )}
      </div>

      {showForm && isOwner && <NewAnnouncementForm onSubmit={(p) => createMut.mutate(p)} />}

      <div className="space-y-3">
        {(data?.data || []).map((a) => (
          <div
            key={a._id}
            className={`rounded-md border bg-white p-4 ${
              a.pinned ? 'border-amber-300 bg-amber-50/40' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {a.pinned && <Pin className="h-3 w-3 text-amber-600" />}
                  <h3 className="font-semibold">{a.title}</h3>
                </div>
                <p className="mt-0.5 text-xs text-gray-500">
                  {a.instructor.name} · {formatRelativeTime(a.createdAt)}
                </p>
                <p className="mt-2 whitespace-pre-line text-sm text-gray-700">{a.body}</p>
              </div>
              {isOwner && (
                <div className="flex gap-1">
                  <button
                    onClick={() => pinMut.mutate(a._id)}
                    className={`p-1.5 ${
                      a.pinned ? 'text-amber-600' : 'text-gray-400'
                    } hover:text-gray-700`}
                    aria-label="Toggle pin"
                  >
                    <Pin className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteMut.mutate(a._id)}
                    className="p-1.5 text-red-500 hover:text-red-700"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {!data?.data?.length && isOwner && (
          <p className="rounded-md border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
            No announcements yet. Use them to keep students informed.
          </p>
        )}
      </div>
    </div>
  );
}

function NewAnnouncementForm({
  onSubmit,
}: {
  onSubmit: (p: { title: string; body: string }) => void;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  return (
    <div className="mb-4 space-y-3 rounded-md border border-gray-200 bg-white p-4">
      <Input
        placeholder="Announcement title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Textarea
        placeholder="What do you want to share with your students?"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <Button
        onClick={() => onSubmit({ title, body })}
        disabled={!title || !body}
      >
        Post announcement
      </Button>
    </div>
  );
}
