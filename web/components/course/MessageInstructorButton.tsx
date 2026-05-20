'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { api, extractError } from '@/lib/api';

export default function MessageInstructorButton({
  instructorId,
}: {
  instructorId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    setError(null);
    setLoading(true);
    try {
      await api.post('/messages', { recipientId: instructorId, body });
      router.push('/messages');
    } catch (e) {
      setError(extractError(e));
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-sm text-brand-700 hover:underline"
      >
        <MessageSquare className="h-4 w-4" />
        Message instructor
      </button>
    );
  }

  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Write a message…"
        className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:border-brand-500 focus:outline-none"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <div className="mt-2 flex gap-2">
        <button
          onClick={send}
          disabled={loading || !body.trim()}
          className="rounded-md bg-brand-600 px-3 py-1 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          Send
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded-md border border-gray-300 px-3 py-1 text-xs"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
