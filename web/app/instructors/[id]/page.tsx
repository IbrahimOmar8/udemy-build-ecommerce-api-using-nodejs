'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Award, BookOpen, Users, Star, Globe, Github, Twitter, Linkedin } from 'lucide-react';
import { api } from '@/lib/api';
import CourseCard from '@/components/course/CourseCard';
import MessageInstructorButton from '@/components/course/MessageInstructorButton';
import { useAuthStore } from '@/store/useAuthStore';
import type { Course } from '@/types';

interface InstructorResponse {
  data: {
    instructor: {
      _id: string;
      name: string;
      profileImg?: string;
      coverImg?: string;
      createdAt?: string;
      instructorProfile?: {
        headline?: string;
        bio?: string;
        expertise?: string[];
        ratingsAverage?: number;
        ratingsQuantity?: number;
        totalStudents?: number;
        totalCourses?: number;
        website?: string;
        socials?: {
          twitter?: string;
          linkedin?: string;
          github?: string;
          youtube?: string;
        };
      };
    };
    courses: Course[];
  };
}

export default function InstructorProfilePage() {
  const params = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);

  const { data, isLoading } = useQuery({
    queryKey: ['instructor', params.id],
    queryFn: async () => {
      const res = await api.get<InstructorResponse>(`/instructors/${params.id}`);
      return res.data;
    },
    enabled: !!params.id,
  });

  if (isLoading) {
    return <div className="mx-auto max-w-7xl px-4 py-12 text-gray-500">Loading…</div>;
  }
  if (!data?.data) {
    return <div className="mx-auto max-w-7xl px-4 py-12 text-gray-500">Not found.</div>;
  }

  const { instructor, courses } = data.data;
  const profile = instructor.instructorProfile;

  return (
    <div>
      <section className="bg-gray-900 px-4 py-12 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 md:flex-row">
          <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-brand-600 text-3xl font-bold">
            {instructor.name.charAt(0).toUpperCase()}
          </span>
          <div className="flex-1">
            <p className="text-xs uppercase text-gray-400">Instructor</p>
            <h1 className="text-3xl font-bold">{instructor.name}</h1>
            {profile?.headline && (
              <p className="mt-1 text-lg text-gray-300">{profile.headline}</p>
            )}

            <div className="mt-4 flex flex-wrap gap-6 text-sm">
              <Stat icon={<Star className="h-4 w-4 text-amber-400" />} label={`${(profile?.ratingsAverage || 0).toFixed(1)} rating`} />
              <Stat icon={<Users className="h-4 w-4" />} label={`${profile?.totalStudents || 0} students`} />
              <Stat icon={<BookOpen className="h-4 w-4" />} label={`${courses.length} courses`} />
            </div>

            {profile?.socials && (
              <div className="mt-4 flex gap-3 text-sm">
                {profile.socials.twitter && (
                  <a href={profile.socials.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white">
                    <Twitter className="h-4 w-4" />
                  </a>
                )}
                {profile.socials.linkedin && (
                  <a href={profile.socials.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white">
                    <Linkedin className="h-4 w-4" />
                  </a>
                )}
                {profile.socials.github && (
                  <a href={profile.socials.github} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white">
                    <Github className="h-4 w-4" />
                  </a>
                )}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white">
                    <Globe className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}

            {user && user._id !== instructor._id && (
              <div className="mt-4 max-w-md">
                <MessageInstructorButton instructorId={instructor._id} />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        {profile?.bio && (
          <div className="mb-10">
            <h2 className="mb-3 text-xl font-bold">About</h2>
            <p className="whitespace-pre-line text-sm leading-7 text-gray-700">
              {profile.bio}
            </p>
          </div>
        )}

        {profile?.expertise && profile.expertise.length > 0 && (
          <div className="mb-10">
            <h2 className="mb-3 text-xl font-bold">Areas of expertise</h2>
            <div className="flex flex-wrap gap-2">
              {profile.expertise.map((e, i) => (
                <span
                  key={i}
                  className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700"
                >
                  {e}
                </span>
              ))}
            </div>
          </div>
        )}

        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
          <Award className="h-5 w-5 text-brand-600" />
          Courses by {instructor.name.split(' ')[0]}
        </h2>
        {courses.length === 0 ? (
          <p className="rounded-md border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
            No published courses yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((c) => (
              <CourseCard key={c._id} course={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-1 text-gray-300">
      {icon}
      {label}
    </span>
  );
}
