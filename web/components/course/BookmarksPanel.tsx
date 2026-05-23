'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bookmark as BookmarkIcon, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Bookmark {
  _id: string;
  lecture: { _id: string; title: string } | string;
  timestampSeconds: number;
  label?: string;
}

interface Props {
  courseId: string;
  lectureId?: string;
  currentTime: number;
  onJump: (lectureId: string, t: number) => void;
}

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
};

export default function BookmarksPanel({
  courseId,
  lectureId,
  currentTime,
  onJump,
}: Props) {
  const queryClient = useQueryClient();
  const [label, setLabel] = useState('');

  const { data } = useQuery({
    queryKey: ['bookmarks', courseId],
    queryFn: async () => {
      const res = await api.get<{ data: Bookmark[] }>(
        `/courses/${courseId}/bookmarks`
      );
      return res.data.data;
    },
  });

  const addMut = useMutation({
    mutationFn: async () => {
      if (!lectureId) return;
      await api.post(`/lectures/${lectureId}/bookmarks`, {
        timestampSeconds: Math.floor(currentTime),
        label: label || undefined,
      });
    },
    onSuccess: () => {
      setLabel('');
      queryClient.invalidateQueries({ queryKey: ['bookmarks', courseId] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/bookmarks/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['bookmarks', courseId] }),
  });

  return (
    <div className="rounded-lg bg-gray-800 p-4 text-gray-100">
      <h3 className="mb-2 flex items-center gap-2 font-semibold">
        <BookmarkIcon className="h-4 w-4 text-amber-400" />
        Bookmarks
      </h3>
      <div className="flex gap-2">
        <Input
          placeholder={`Label at ${fmt(currentTime)} (optional)`}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="bg-gray-900 text-white placeholder-gray-500"
        />
        <Button
          size="sm"
          onClick={() => addMut.mutate()}
          loading={addMut.isPending}
          disabled={!lectureId}
        >
          Save
        </Button>
      </div>
      <ul className="mt-3 space-y-1">
        {(data || []).map((b) => {
          const lec = typeof b.lecture === 'object' ? b.lecture : null;
          return (
            <li
              key={b._id}
              className="flex items-center justify-between gap-2 rounded bg-gray-700/50 px-2 py-1.5 text-sm"
            >
              <button
                onClick={() =>
                  onJump(
                    typeof b.lecture === 'object' ? b.lecture._id : b.lecture,
                    b.timestampSeconds
                  )
                }
                className="flex-1 text-left hover:text-amber-300"
              >
                <span className="font-mono text-xs text-amber-300">
                  {fmt(b.timestampSeconds)}
                </span>{' '}
                — {b.label || (lec?.title ?? 'bookmark')}
              </button>
              <button
                onClick={() => deleteMut.mutate(b._id)}
                className="text-gray-400 hover:text-red-400"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </li>
          );
        })}
        {!data?.length && (
          <li className="text-xs text-gray-500">No bookmarks yet.</li>
        )}
      </ul>
    </div>
  );
}
