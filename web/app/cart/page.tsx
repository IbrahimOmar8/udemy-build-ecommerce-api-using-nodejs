'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import Link from 'next/link';
import {
  applyCouponToCart,
  fetchCart,
  freeCheckout,
  removeFromCart,
  stripeCheckout,
} from '@/lib/queries';
import { useAuthStore } from '@/store/useAuthStore';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { extractError } from '@/lib/api';
import type { Course } from '@/types';

export default function CartPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, hydrated } = useAuthStore();
  const [couponCode, setCouponCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && !user) router.push('/login?redirect=/cart');
  }, [hydrated, user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: fetchCart,
    enabled: !!user,
  });

  const removeMut = useMutation({
    mutationFn: removeFromCart,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const couponMut = useMutation({
    mutationFn: () => applyCouponToCart(couponCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setError(null);
    },
    onError: (e) => setError(extractError(e)),
  });

  const stripeMut = useMutation({
    mutationFn: stripeCheckout,
    onSuccess: (res: any) => {
      if (res?.url) window.location.href = res.url;
    },
    onError: (e) => setError(extractError(e)),
  });

  const freeMut = useMutation({
    mutationFn: freeCheckout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      router.push('/dashboard');
    },
    onError: (e) => setError(extractError(e)),
  });

  if (!user) return null;

  const cart = data?.data;
  const items = cart?.items || [];
  const total = cart?.totalAfterDiscount ?? cart?.totalPrice ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Shopping cart</h1>

      {isLoading ? (
        <p className="text-gray-500">Loading…</p>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-gray-500">Your cart is empty.</p>
          <Link
            href="/courses"
            className="mt-4 inline-block rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Browse courses
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            {items.map((item, i) => {
              const course = item.course as Course;
              return (
                <div
                  key={i}
                  className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4"
                >
                  {course.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="h-20 w-32 rounded object-cover"
                    />
                  ) : (
                    <div className="h-20 w-32 rounded bg-gray-100" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">{course.title}</h3>
                    <p className="text-sm text-gray-500">
                      {typeof course.instructor === 'object'
                        ? course.instructor.name
                        : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatPrice(item.price)}</p>
                    <button
                      onClick={() => removeMut.mutate(course._id)}
                      className="mt-1 text-xs text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="inline h-3 w-3" /> Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <aside className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="mb-3 text-lg font-bold">Summary</h2>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(cart?.totalPrice || 0)}</span>
              </div>
              {(cart?.totalPrice || 0) !== total && (
                <div className="flex justify-between text-sm text-green-700">
                  <span>Discount</span>
                  <span>-{formatPrice((cart?.totalPrice || 0) - total)}</span>
                </div>
              )}
              <div className="mt-3 flex justify-between border-t border-gray-200 pt-3 text-base font-bold">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>

              {error && (
                <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button
                onClick={() =>
                  total === 0 ? freeMut.mutate() : stripeMut.mutate()
                }
                loading={stripeMut.isPending || freeMut.isPending}
                className="mt-4 w-full"
                size="lg"
              >
                Checkout
              </Button>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="mb-2 text-sm font-semibold">Coupon</h2>
              <div className="flex gap-2">
                <Input
                  placeholder="Code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <Button
                  variant="outline"
                  onClick={() => couponMut.mutate()}
                  loading={couponMut.isPending}
                  disabled={!couponCode}
                >
                  Apply
                </Button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
