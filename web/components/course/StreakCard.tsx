'use client';

import { useQuery } from '@tanstack/react-query';
import { Flame, Clock, Calendar } from 'lucide-react';
import { api } from '@/lib/api';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalDaysActive: number;
  minutesToday: number;
  minutesAllTime: number;
  lastActivityDate?: string;
}

export default function StreakCard() {
  const { data } = useQuery({
    queryKey: ['streak', 'me'],
    queryFn: async () => {
      const res = await api.get<{ data: StreakData }>('/streak/me');
      return res.data.data;
    },
  });

  if (!data) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase text-amber-700">Learning streak</p>
          <div className="mt-1 flex items-baseline gap-1">
            <Flame className="h-7 w-7 text-amber-500" />
            <span className="text-3xl font-bold">{data.currentStreak}</span>
            <span className="text-sm text-gray-600">
              {data.currentStreak === 1 ? 'day' : 'days'}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-600">
            Longest: {data.longestStreak} {data.longestStreak === 1 ? 'day' : 'days'}
          </p>
        </div>
        <div className="space-y-2 text-end text-xs text-gray-700">
          <div className="flex items-center justify-end gap-1">
            <Clock className="h-3 w-3" />
            <span>
              <span className="font-semibold">{data.minutesToday}m</span> today
            </span>
          </div>
          <div className="flex items-center justify-end gap-1">
            <Calendar className="h-3 w-3" />
            <span>
              <span className="font-semibold">{data.totalDaysActive}</span> days active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
