'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/store/useAuthStore';
import { api, extractError } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface FormValues {
  name: string;
  email: string;
  phone?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, hydrated, fetchMe } = useAuthStore();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && !user) router.push('/login?redirect=/profile');
  }, [hydrated, user, router]);

  const { register, handleSubmit, reset, formState: { isSubmitting } } =
    useForm<FormValues>();

  useEffect(() => {
    if (user) reset({ name: user.name, email: user.email });
  }, [user, reset]);

  const onSubmit = async (values: FormValues) => {
    setMsg(null);
    setErr(null);
    try {
      await api.put('/users/me', values);
      await fetchMe();
      setMsg('Profile updated.');
    } catch (e) {
      setErr(extractError(e));
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Profile</h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 rounded-lg border border-gray-200 bg-white p-6"
      >
        <Input label="Name" {...register('name', { required: true })} />
        <Input label="Email" type="email" {...register('email', { required: true })} />
        <Input label="Phone" {...register('phone')} />
        {msg && <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</div>}
        {err && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
        <Button type="submit" loading={isSubmitting}>
          Save changes
        </Button>
      </form>
    </div>
  );
}
