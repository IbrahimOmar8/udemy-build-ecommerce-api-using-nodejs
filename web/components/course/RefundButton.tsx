'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api, extractError } from '@/lib/api';

interface Props {
  enrollmentId: string;
}

export default function RefundButton({ enrollmentId }: Props) {
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const eligibility = useQuery({
    queryKey: ['refund-eligibility', enrollmentId],
    queryFn: async () => {
      const res = await api.get(`/payments/refund-eligibility/${enrollmentId}`);
      return res.data;
    },
  });

  const refundMut = useMutation({
    mutationFn: async () => {
      const res = await api.post('/payments/refund', { enrollmentId, reason });
      return res.data;
    },
    onSuccess: (data) => {
      setMsg({ kind: 'ok', text: data.message || 'Refund processed.' });
      queryClient.invalidateQueries({ queryKey: ['enrollments', 'me'] });
    },
    onError: (e) => setMsg({ kind: 'err', text: extractError(e) }),
  });

  if (!eligibility.data || !eligibility.data.eligible) {
    return (
      <span
        className="text-xs text-gray-400"
        title={eligibility.data?.reason || 'Refund not available'}
      >
        Refund unavailable
      </span>
    );
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      {!confirm ? (
        <button
          onClick={(e) => {
            e.preventDefault();
            setConfirm(true);
          }}
          className="text-xs font-medium text-amber-700 hover:underline"
        >
          Request refund · {eligibility.data.daysLeft} days left
        </button>
      ) : (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs">
          {msg ? (
            <p className={msg.kind === 'ok' ? 'text-green-700' : 'text-red-700'}>
              {msg.text}
            </p>
          ) : (
            <>
              <p className="mb-2 font-medium text-amber-900">
                30-day money-back guarantee. Refund ${eligibility.data.pricePaid}?
              </p>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason (optional)"
                className="mb-2 w-full rounded border border-amber-300 bg-white px-2 py-1 text-xs"
              />
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    refundMut.mutate();
                  }}
                  disabled={refundMut.isPending}
                  className="rounded bg-amber-600 px-2 py-1 text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  Confirm refund
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setConfirm(false);
                  }}
                  className="rounded border border-gray-300 px-2 py-1 text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
