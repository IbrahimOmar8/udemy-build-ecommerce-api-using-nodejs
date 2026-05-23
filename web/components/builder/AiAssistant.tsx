'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { api, extractError } from '@/lib/api';

type Action = 'description' | 'outcomes' | 'requirements' | 'outline';

interface Props {
  title: string;
  brief?: string;
  level?: string;
  description?: string;
  onDescription?: (text: string) => void;
  onOutcomes?: (items: string[]) => void;
  onRequirements?: (items: string[]) => void;
  onOutline?: (data: any) => void;
}

const LABELS: Record<Action, string> = {
  description: 'Draft description',
  outcomes: 'Generate outcomes',
  requirements: 'Generate requirements',
  outline: 'Suggest section outline',
};

export default function AiAssistant({
  title,
  brief,
  level,
  description,
  onDescription,
  onOutcomes,
  onRequirements,
  onOutline,
}: Props) {
  const [loading, setLoading] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: Action) => {
    if (!title.trim()) {
      setError('Add a course title first.');
      return;
    }
    setLoading(action);
    setError(null);
    try {
      switch (action) {
        case 'description': {
          const res = await api.post('/ai/course/description', { title, brief, level });
          onDescription?.(res.data.data.description);
          break;
        }
        case 'outcomes': {
          const res = await api.post('/ai/course/outcomes', { title, description, level });
          onOutcomes?.(res.data.data.outcomes);
          break;
        }
        case 'requirements': {
          const res = await api.post('/ai/course/requirements', { title, description, level });
          onRequirements?.(res.data.data.requirements);
          break;
        }
        case 'outline': {
          const res = await api.post('/ai/course/outline', { title, description, level });
          onOutline?.(res.data.data);
          break;
        }
      }
    } catch (e) {
      setError(extractError(e));
    } finally {
      setLoading(null);
    }
  };

  const actions: Action[] = ['description', 'outcomes', 'requirements', 'outline'].filter((a) => {
    if (a === 'description') return !!onDescription;
    if (a === 'outcomes') return !!onOutcomes;
    if (a === 'requirements') return !!onRequirements;
    if (a === 'outline') return !!onOutline;
    return false;
  }) as Action[];

  return (
    <div className="rounded-lg border border-brand-200 bg-brand-50/40 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-800">
        <Sparkles className="h-4 w-4" />
        AI assistant
      </div>
      <p className="mb-3 text-xs text-gray-600">
        Generate course copy from your title and brief. You can edit anything it produces.
      </p>
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => run(a)}
            disabled={!!loading}
            className="flex items-center gap-1.5 rounded-md border border-brand-300 bg-white px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100 disabled:opacity-50"
          >
            {loading === a ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            {LABELS[a]}
          </button>
        ))}
      </div>
      {error && (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
