'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, MessageCircle, ThumbsUp } from 'lucide-react';
import {
  askQuestion,
  fetchCourseQna,
  replyToQna,
  upvoteQna,
  type Qna,
} from '@/lib/qnaQueries';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { formatRelativeTime } from '@/lib/utils';
import { extractError } from '@/lib/api';
import { getSocket } from '@/lib/socket';

interface Props {
  courseId: string;
}

export default function QnaPanel({ courseId }: Props) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['qna', courseId],
    queryFn: () => fetchCourseQna(courseId),
    enabled: !!courseId,
  });

  // Realtime: join course room, listen for new answers
  useEffect(() => {
    if (!user || !courseId) return;
    const socket = getSocket();
    socket.emit('course:join', courseId);
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: ['qna', courseId] });
    };
    socket.on('qna:answer', handler);
    return () => {
      socket.emit('course:leave', courseId);
      socket.off('qna:answer', handler);
    };
  }, [courseId, user, queryClient]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Q&amp;A ({data?.results || 0})</h2>
        {user && (
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            <MessageCircle className="h-4 w-4" />
            {showForm ? 'Cancel' : 'Ask a question'}
          </Button>
        )}
      </div>

      {showForm && user && (
        <NewQuestionForm
          courseId={courseId}
          onDone={() => {
            setShowForm(false);
            queryClient.invalidateQueries({ queryKey: ['qna', courseId] });
          }}
        />
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (data?.data || []).length === 0 ? (
        <p className="rounded-md border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
          No questions yet. Be the first to ask.
        </p>
      ) : (
        <ul className="space-y-3">
          {data!.data.map((q) => (
            <QnaItem key={q._id} qna={q} />
          ))}
        </ul>
      )}
    </div>
  );
}

function NewQuestionForm({
  courseId,
  onDone,
}: {
  courseId: string;
  onDone: () => void;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const mut = useMutation({
    mutationFn: () => askQuestion(courseId, { title, body }),
    onSuccess: onDone,
    onError: (e) => setErr(extractError(e)),
  });

  return (
    <div className="mb-4 space-y-3 rounded-md border border-gray-200 bg-white p-4">
      <Input
        placeholder="Question title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Textarea
        placeholder="Describe your question…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      {err && <p className="text-sm text-red-600">{err}</p>}
      <Button
        onClick={() => mut.mutate()}
        loading={mut.isPending}
        disabled={!title || !body}
      >
        Post question
      </Button>
    </div>
  );
}

function QnaItem({ qna }: { qna: Qna }) {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [expanded, setExpanded] = useState(false);
  const [reply, setReply] = useState('');

  const upvoteMut = useMutation({
    mutationFn: () => upvoteQna(qna._id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['qna', qna.course] }),
  });
  const replyMut = useMutation({
    mutationFn: () => replyToQna(qna._id, reply),
    onSuccess: () => {
      setReply('');
      queryClient.invalidateQueries({ queryKey: ['qna', qna.course] });
    },
  });

  return (
    <li className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
          {qna.user.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">{qna.user.name}</span>
            <span className="text-xs text-gray-500">{formatRelativeTime(qna.createdAt)}</span>
            {qna.isResolved && (
              <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-green-700">
                Answered
              </span>
            )}
          </div>
          <h4 className="mt-1 font-semibold">{qna.title}</h4>
          <p className="mt-1 whitespace-pre-line text-sm text-gray-700">{qna.body}</p>

          <div className="mt-2 flex items-center gap-3 text-xs text-gray-600">
            <button
              onClick={() => upvoteMut.mutate()}
              disabled={!user}
              className="flex items-center gap-1 hover:text-brand-700 disabled:opacity-50"
            >
              <ThumbsUp className="h-3 w-3" /> {qna.upvotes}
            </button>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 hover:text-brand-700"
            >
              {expanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              {qna.answers.length} answers
            </button>
          </div>

          {expanded && (
            <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
              {qna.answers.map((a) => (
                <div key={a._id} className="flex items-start gap-3">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      a.isInstructor
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {a.user.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-semibold">{a.user.name}</span>{' '}
                      {a.isInstructor && (
                        <span className="rounded bg-amber-100 px-1 text-[10px] font-bold text-amber-700">
                          INSTRUCTOR
                        </span>
                      )}
                      <span className="ms-2 text-xs text-gray-500">
                        {formatRelativeTime(a.createdAt)}
                      </span>
                    </p>
                    <p className="mt-0.5 whitespace-pre-line text-sm text-gray-700">
                      {a.text}
                    </p>
                  </div>
                </div>
              ))}

              {user && (
                <div className="mt-2 flex gap-2">
                  <Input
                    placeholder="Write a reply…"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                  />
                  <Button
                    size="sm"
                    onClick={() => replyMut.mutate()}
                    loading={replyMut.isPending}
                    disabled={!reply.trim()}
                  >
                    Reply
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
