export type UserRole = 'student' | 'instructor' | 'admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  profileImg?: string;
}

export interface InstructorLite {
  _id: string;
  name: string;
  profileImg?: string;
}

export interface Course {
  _id: string;
  title: string;
  slug: string;
  subtitle?: string;
  description: string;
  instructor: InstructorLite | string;
  category: string | { _id: string; name: string };
  level: string;
  thumbnail?: string;
  price: number;
  discountPrice?: number;
  isFree?: boolean;
  status: string;
  totalLectures: number;
  totalDurationSeconds: number;
  ratingsAverage: number;
  ratingsQuantity: number;
  enrollmentsCount: number;
  sections?: Section[];
}

export interface Section {
  _id: string;
  title: string;
  course: string;
  order: number;
  lectures?: Lecture[];
}

export interface Lecture {
  _id: string;
  title: string;
  description?: string;
  section: string;
  course: string;
  order: number;
  type: 'video' | 'article' | 'quiz' | 'assignment';
  videoUrl?: string;
  durationSeconds?: number;
  article?: string;
  attachments?: { name: string; url: string }[];
  isPreview?: boolean;
}

export interface Enrollment {
  _id: string;
  student: string;
  course: Course | string;
  progressPercent: number;
  completedLectures: string[];
  lastLecture?: string;
}

export interface AuthResponse {
  data: User;
  accessToken: string;
  refreshToken: string;
}

export interface ListResponse<T> {
  results: number;
  data: T[];
}
