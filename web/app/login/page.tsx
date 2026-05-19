'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/store/useAuthStore';
import { extractError } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface FormValues {
  email: string;
  password: string;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-16 text-gray-500">Loading…</div>}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const login = useAuthStore((s) => s.login);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      await login(values.email, values.password);
      router.push(params.get('redirect') || '/dashboard');
    } catch (err) {
      setError(extractError(err));
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold">Welcome back</h1>
        <p className="mb-6 text-sm text-gray-600">Log in to continue learning.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            {...register('email', { required: 'Email is required' })}
            error={errors.email?.message}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            {...register('password', { required: 'Password is required' })}
            error={errors.password?.message}
          />

          {error && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
            Log in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-brand-700 hover:underline">
            Sign up
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-gray-500">
          <Link href="/forgot-password" className="hover:underline">
            Forgot password?
          </Link>
        </p>
      </div>
    </div>
  );
}
