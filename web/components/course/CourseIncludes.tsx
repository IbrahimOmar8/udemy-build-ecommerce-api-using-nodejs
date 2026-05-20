import { Award, Download, FileText, Globe, Infinity, MonitorPlay, Smartphone } from 'lucide-react';
import { formatDuration } from '@/lib/utils';
import type { Course } from '@/types';

interface Props {
  course: Course;
}

/**
 * Udemy-iconic "This course includes:" panel.
 */
export default function CourseIncludes({ course }: Props) {
  const downloadableCount = (course.sections || [])
    .flatMap((s) => s.lectures || [])
    .reduce((acc, l) => acc + (l.attachments?.length || 0), 0);
  const articleCount = (course.sections || [])
    .flatMap((s) => s.lectures || [])
    .filter((l) => l.type === 'article').length;

  const items = [
    {
      icon: <MonitorPlay className="h-4 w-4" />,
      text: `${formatDuration(course.totalDurationSeconds)} on-demand video`,
    },
    ...(articleCount
      ? [{ icon: <FileText className="h-4 w-4" />, text: `${articleCount} articles` }]
      : []),
    ...(downloadableCount
      ? [{ icon: <Download className="h-4 w-4" />, text: `${downloadableCount} downloadable resources` }]
      : []),
    {
      icon: <Infinity className="h-4 w-4" />,
      text: 'Full lifetime access',
    },
    {
      icon: <Smartphone className="h-4 w-4" />,
      text: 'Access on mobile and TV',
    },
    ...(course.language
      ? [{ icon: <Globe className="h-4 w-4" />, text: `${course.language.toUpperCase()} subtitles` }]
      : []),
    ...(course.hasCertificate
      ? [{ icon: <Award className="h-4 w-4" />, text: 'Certificate of completion' }]
      : []),
  ];

  return (
    <div className="rounded-md border border-gray-200 bg-white p-4">
      <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
        This course includes:
      </h4>
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
            <span className="text-gray-500">{item.icon}</span>
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
