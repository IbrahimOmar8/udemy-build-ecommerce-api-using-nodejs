'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { fetchNotifications, unreadCount as fetchUnreadCount } from '@/lib/queries';
import type { Notification } from '@/types';

export function useNotifications() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [liveCount, setLiveCount] = useState(0);

  const list = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    enabled: !!user,
  });

  const unread = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: fetchUnreadCount,
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const socket = getSocket();
    const handler = (n: Notification) => {
      setLiveCount((c) => c + 1);
      queryClient.setQueryData(['notifications'], (old: any) => {
        if (!old) return { results: 1, data: [n] };
        return {
          ...old,
          results: (old.results || 0) + 1,
          data: [n, ...(old.data || [])],
        };
      });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] });
    };
    socket.on('notification:new', handler);
    return () => {
      socket.off('notification:new', handler);
    };
  }, [user, queryClient]);

  useEffect(() => {
    if (!user) disconnectSocket();
  }, [user]);

  const totalUnread = (unread.data?.count || 0) + liveCount;
  return {
    notifications: list.data?.data || [],
    isLoading: list.isLoading,
    unreadCount: totalUnread,
    resetLiveCount: () => setLiveCount(0),
  };
}
