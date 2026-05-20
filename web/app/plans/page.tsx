'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Check, Sparkles } from 'lucide-react';
import { api, extractError } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';

interface Plan {
  _id: string;
  code: string;
  name: string;
  description?: string;
  tier: 'personal' | 'team' | 'business';
  pricePerMonth: number;
  pricePerYear?: number;
  features: string[];
  catalogAccess: 'all_published' | 'curated';
}

export default function PlansPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [err, setErr] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const res = await api.get<{ data: Plan[] }>('/plans');
      return res.data;
    },
  });

  const checkoutMut = useMutation({
    mutationFn: async (planId: string) => {
      const res = await api.post('/subscriptions/checkout', {
        planId,
        billingCycle: cycle,
      });
      return res.data;
    },
    onSuccess: (data) => {
      if (data?.url) window.location.href = data.url;
    },
    onError: (e) => setErr(extractError(e)),
  });

  const onSubscribe = (planId: string) => {
    if (!user) {
      router.push('/login?redirect=/plans');
      return;
    }
    checkoutMut.mutate(planId);
  };

  const plans = data?.data || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="text-center">
        <h1 className="flex items-center justify-center gap-2 text-3xl font-bold md:text-4xl">
          <Sparkles className="h-7 w-7 text-amber-500" />
          Subscribe and learn unlimited
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-gray-600">
          Get unlimited access to thousands of top-rated courses with one
          monthly subscription.
        </p>

        <div className="mt-6 inline-flex rounded-full border border-gray-300 bg-white p-1 text-sm">
          {(['monthly', 'yearly'] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCycle(c)}
              className={`rounded-full px-4 py-1.5 transition ${
                cycle === c
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {c === 'monthly' ? 'Monthly' : 'Yearly · save 2 months'}
            </button>
          ))}
        </div>
      </div>

      {err && (
        <div className="mx-auto mt-4 max-w-md rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      )}

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        {plans.length === 0 ? (
          <p className="col-span-3 rounded-md border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-500">
            No plans available yet. Ask an admin to create them.
          </p>
        ) : (
          plans.map((plan, idx) => {
            const price =
              cycle === 'yearly'
                ? plan.pricePerYear || plan.pricePerMonth * 10
                : plan.pricePerMonth;
            const popular = idx === 1;
            return (
              <div
                key={plan._id}
                className={`relative rounded-2xl border bg-white p-6 ${
                  popular
                    ? 'border-brand-500 shadow-lg ring-2 ring-brand-200'
                    : 'border-gray-200'
                }`}
              >
                {popular && (
                  <span className="absolute -top-3 start-6 rounded-full bg-brand-600 px-3 py-0.5 text-xs font-semibold text-white">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-bold">{plan.name}</h3>
                {plan.description && (
                  <p className="mt-1 text-sm text-gray-600">{plan.description}</p>
                )}
                <p className="mt-4">
                  <span className="text-3xl font-bold">{formatPrice(price)}</span>
                  <span className="ms-1 text-sm text-gray-500">
                    /{cycle === 'monthly' ? 'mo' : 'yr'}
                  </span>
                </p>
                <ul className="mt-5 space-y-2">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      <span>{f}</span>
                    </li>
                  ))}
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    <span>
                      {plan.catalogAccess === 'all_published'
                        ? 'Access all published courses'
                        : 'Curated course catalog'}
                    </span>
                  </li>
                </ul>
                <Button
                  onClick={() => onSubscribe(plan._id)}
                  loading={checkoutMut.isPending}
                  className="mt-6 w-full"
                  size="lg"
                  variant={popular ? 'primary' : 'outline'}
                >
                  Subscribe
                </Button>
              </div>
            );
          })
        )}
      </div>

      <p className="mt-10 text-center text-xs text-gray-500">
        Cancel anytime. Subscription auto-renews at the price shown until cancelled.
      </p>
    </div>
  );
}
