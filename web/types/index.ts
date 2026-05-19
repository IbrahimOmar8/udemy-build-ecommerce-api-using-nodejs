export type UserRole = 'student' | 'instructor' | 'admin';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  profileImg?: string;
  emailVerified?: boolean;
  preferredLanguage?: string;
  instructorProfile?: {
    headline?: string;
    bio?: string;
    expertise?: string[];
    ratingsAverage?: number;
    ratingsQuantity?: number;
    totalStudents?: number;
    totalCourses?: number;
    approved?: boolean;
  };
  wishlist?: string[];
  enrolledCount?: number;
  createdAt?: string;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

export interface InstructorLite {
  _id: string;
  name: string;
  profileImg?: string;
  instructorProfile?: { headline?: string };
}

export interface Course {
  _id: string;
  title: string;
  slug: string;
  subtitle?: string;
  description: string;
  instructor: InstructorLite | string;
  category: string | Category;
  level: 'beginner' | 'intermediate' | 'advanced' | 'all';
  language: string;
  thumbnail?: string;
  promoVideo?: string;
  price: number;
  discountPrice?: number;
  isFree?: boolean;
  status: 'draft' | 'pending_review' | 'published' | 'archived' | 'rejected';
  totalLectures: number;
  totalSections: number;
  totalDurationSeconds: number;
  ratingsAverage: number;
  ratingsQuantity: number;
  enrollmentsCount: number;
  learningOutcomes?: string[];
  requirements?: string[];
  tags?: string[];
  hasCertificate?: boolean;
  sections?: Section[];
  createdAt?: string;
}

export interface Section {
  _id: string;
  title: string;
  description?: string;
  course: string;
  order: number;
  totalLectures?: number;
  totalDurationSeconds?: number;
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
  completedAt?: string;
  certificateIssued: boolean;
  certificate?: string;
}

export interface Review {
  _id: string;
  title?: string;
  comment?: string;
  ratings: number;
  user: { _id: string; name: string; profileImg?: string };
  course: string;
  createdAt: string;
}

export interface Cart {
  _id: string;
  user: string;
  items: { course: Course | string; price: number }[];
  coupon?: string;
  totalPrice: number;
  totalAfterDiscount: number;
}

export interface Notification {
  _id: string;
  recipient: string;
  type: string;
  title: string;
  body?: string;
  data?: unknown;
  isRead: boolean;
  createdAt: string;
}

export interface Pagination {
  currentPage: number;
  limit: number;
  numberOfPages: number;
  totalDocuments: number;
  next?: number;
  prev?: number;
}

export interface ListResponse<T> {
  results: number;
  paginationResult?: Pagination;
  data: T[];
}

export interface SingleResponse<T> {
  data: T;
}

export interface AuthResponse {
  data: User;
  accessToken: string;
  refreshToken: string;
}
