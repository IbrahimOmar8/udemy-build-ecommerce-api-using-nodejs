'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { createCourse, fetchCategories } from '@/lib/queries';
import { useAuthStore } from '@/store/useAuthStore';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import AiAssistant from '@/components/builder/AiAssistant';
import { extractError } from '@/lib/api';

interface FormValues {
  title: string;
  subtitle?: string;
  description: string;
  category: string;
  level: string;
  language: string;
  price: number;
  isFree: boolean;
}

export default function NewCoursePage() {
  const router = useRouter();
  const { user, hydrated } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && (!user || user.role !== 'instructor')) {
      router.push('/login?redirect=/instructor/courses/new');
    }
  }, [hydrated, user, router]);

  const { data: cats } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { level: 'all', language: 'en', price: 0, isFree: false },
  });

  const watchedTitle = watch('title') || '';
  const watchedLevel = watch('level') || 'all';
  const watchedDescription = watch('description') || '';

  const mut = useMutation({
    mutationFn: (form: FormValues) => createCourse(form as unknown as Record<string, unknown>),
    onSuccess: (res) => router.push(`/instructor/courses/${res.data._id}/edit`),
    onError: (e) => setError(extractError(e)),
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold">Create a new course</h1>
      <p className="mb-6 text-sm text-gray-600">
        Start with the essentials. You can add sections, lectures, quizzes, and publish later.
      </p>

      <form
        onSubmit={handleSubmit((v) => mut.mutate(v))}
        className="space-y-4 rounded-lg border border-gray-200 bg-white p-6"
      >
        <Input
          label="Course title"
          {...register('title', { required: 'Title is required', minLength: 4 })}
          error={errors.title?.message}
        />
        <Input label="Subtitle (optional)" {...register('subtitle')} />

        <AiAssistant
          title={watchedTitle}
          level={watchedLevel}
          brief={watch('subtitle')}
          description={watchedDescription}
          onDescription={(t) => setValue('description', t, { shouldDirty: true })}
        />

        <Textarea
          label="Description"
          rows={5}
          {...register('description', { required: 'Description is required' })}
          error={errors.description?.message}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
            <select
              {...register('category', { required: 'Category is required' })}
              className="h-10 w-full rounded-md border border-gray-300 px-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="">Select…</option>
              {cats?.data?.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-xs text-red-600">{errors.category.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Level</label>
            <select
              {...register('level')}
              className="h-10 w-full rounded-md border border-gray-300 px-2 text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="all">All levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Language" {...register('language')} />
          <Input
            label="Price (USD)"
            type="number"
            step="0.01"
            {...register('price', { valueAsNumber: true, min: 0 })}
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register('isFree')} />
          Free course
        </label>

        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <Button type="submit" loading={isSubmitting || mut.isPending} size="lg">
          Create draft
        </Button>
      </form>
    </div>
  );
}
