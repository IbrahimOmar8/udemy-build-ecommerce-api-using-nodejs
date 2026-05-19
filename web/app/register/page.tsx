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
  name: string;
  email: string;
  password: string;
  role: 'student' | 'instructor';
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-12 text-gray-500">Loading…</div>}>
      <RegisterPageContent />
    </Suspense>
  );
}

function RegisterPageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const initialRole = params.get('role') === 'instructor' ? 'instructor' : 'student';
  const register = useAuthStore((s) => s.register);

  const [error, setError] = useState<string | null>(null);

  const {
    register: rhfRegister,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { role: initialRole } });

  const role = watch('role');

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      const user = await register(values.name, values.email, values.password, values.role);
      router.push(user.role === 'instructor' ? '/instructor' : '/dashboard');
    } catch (err) {
      setError(extractError(err));
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold">Create your account</h1>
        <p className="mb-6 text-sm text-gray-600">
          Join thousands learning and teaching online.
        </p>

        <div className="mb-6 grid grid-cols-2 gap-2 rounded-md bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setValue('role', 'student')}
            className={`rounded-md py-2 text-sm font-medium ${
              role === 'student' ? 'bg-white text-brand-700 shadow' : 'text-gray-600'
            }`}
          >
            I want to learn
          </button>
          <button
            type="button"
            onClick={() => setValue('role', 'instructor')}
            className={`rounded-md py-2 text-sm font-medium ${
              role === 'instructor' ? 'bg-white text-brand-700 shadow' : 'text-gray-600'
            }`}
          >
            I want to teach
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...rhfRegister('role')} />
          <Input
            label="Full name"
            {...rhfRegister('name', { required: 'Name is required', minLength: 3 })}
            error={errors.name?.message}
          />
          <Input
            label="Email"
            type="email"
            {...rhfRegister('email', { required: 'Email is required' })}
            error={errors.email?.message}
          />
          <Input
            label="Password"
            type="password"
            {...rhfRegister('password', {
              required: 'Password is required',
              minLength: { value: 6, message: 'Min 6 characters' },
            })}
            error={errors.password?.message}
          />

          {error && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-brand-700 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
