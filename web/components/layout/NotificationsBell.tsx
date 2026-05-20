'use client';

import { useEffect, useRef, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { useNotifications } from '@/hooks/useNotifications';
import { formatRelativeTime } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { notifications, unreadCount, resetLiveCount } = useNotifications();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const markAllRead = async () => {
    await api.post('/notifications/read-all');
    resetLiveCount();
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 text-gray-600 hover:text-gray-900"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute end-0 mt-2 w-80 rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-brand-700 hover:underline"
              >
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-gray-500">
                No notifications yet.
              </p>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div
                  key={n._id}
                  className={`border-b border-gray-100 px-3 py-3 text-sm last:border-b-0 ${
                    n.isRead ? '' : 'bg-brand-50/40'
                  }`}
                >
                  <p className="font-medium">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-xs text-gray-600">{n.body}</p>}
                  <p className="mt-1 text-[10px] text-gray-400">
                    {formatRelativeTime(n.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
