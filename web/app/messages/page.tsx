'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { formatRelativeTime } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getSocket } from '@/lib/socket';

interface Conversation {
  _id: string;
  other: { _id: string; name: string; profileImg?: string; role: string };
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

interface Message {
  _id: string;
  sender: string;
  recipient: string;
  body: string;
  createdAt: string;
  readAt?: string;
}

export default function MessagesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, hydrated } = useAuthStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hydrated && !user) router.push('/login?redirect=/messages');
  }, [hydrated, user, router]);

  const conversations = useQuery({
    queryKey: ['messages', 'conversations'],
    queryFn: async () => {
      const res = await api.get<{ data: Conversation[] }>(
        '/messages/conversations'
      );
      return res.data;
    },
    enabled: !!user,
  });

  const messages = useQuery({
    queryKey: ['messages', 'conversation', activeId],
    queryFn: async () => {
      const res = await api.get<{ data: Message[] }>(
        `/messages/conversations/${activeId}`
      );
      return res.data;
    },
    enabled: !!activeId,
  });

  const activeConv = conversations.data?.data.find((c) => c._id === activeId);

  const sendMut = useMutation({
    mutationFn: async () => {
      if (!activeConv) return;
      const res = await api.post('/messages', {
        recipientId: activeConv.other._id,
        body: draft,
      });
      return res.data;
    },
    onSuccess: () => {
      setDraft('');
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversation', activeId] });
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });
    },
  });

  // Socket: live new messages
  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    const handler = (payload: { conversationId: string }) => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversations'] });
      if (payload.conversationId === activeId) {
        queryClient.invalidateQueries({
          queryKey: ['messages', 'conversation', activeId],
        });
      }
    };
    socket.on('message:new', handler);
    return () => {
      socket.off('message:new', handler);
    };
  }, [user, activeId, queryClient]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.data, activeId]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">Messages</h1>
      <div className="grid h-[70vh] grid-cols-1 overflow-hidden rounded-lg border border-gray-200 bg-white md:grid-cols-[280px_1fr]">
        {/* Conversation list */}
        <aside className="overflow-y-auto border-b border-gray-200 md:border-b-0 md:border-e">
          {conversations.isLoading ? (
            <p className="p-4 text-sm text-gray-500">Loading…</p>
          ) : (conversations.data?.data || []).length === 0 ? (
            <p className="p-4 text-sm text-gray-500">
              No conversations yet. Start one from a course or instructor profile.
            </p>
          ) : (
            (conversations.data?.data || []).map((c) => (
              <button
                key={c._id}
                onClick={() => setActiveId(c._id)}
                className={`flex w-full items-center gap-3 border-b border-gray-100 p-3 text-start hover:bg-gray-50 ${
                  activeId === c._id ? 'bg-brand-50' : ''
                }`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                  {c.other.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{c.other.name}</p>
                    {c.unreadCount > 0 && (
                      <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-gray-500">
                    {c.lastMessage || 'No messages'}
                  </p>
                </div>
              </button>
            ))
          )}
        </aside>

        {/* Thread */}
        <section className="flex flex-col">
          {activeConv ? (
            <>
              <div className="flex items-center gap-3 border-b border-gray-200 p-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                  {activeConv.other.name.charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="font-semibold">{activeConv.other.name}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {activeConv.other.role}
                  </p>
                </div>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {(messages.data?.data || []).map((m) => {
                  const mine = m.sender === user._id;
                  return (
                    <div
                      key={m._id}
                      className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                          mine
                            ? 'bg-brand-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{m.body}</p>
                        <p
                          className={`mt-1 text-[10px] ${
                            mine ? 'text-brand-100' : 'text-gray-500'
                          }`}
                        >
                          {formatRelativeTime(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <div className="flex items-center gap-2 border-t border-gray-200 p-3">
                <Input
                  placeholder="Type a message…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && draft.trim()) {
                      e.preventDefault();
                      sendMut.mutate();
                    }
                  }}
                />
                <Button
                  onClick={() => sendMut.mutate()}
                  loading={sendMut.isPending}
                  disabled={!draft.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-gray-500">
              Select a conversation
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
