import { api } from './api';
import type {
  Cart,
  Category,
  Course,
  Enrollment,
  ListResponse,
  Notification,
  Review,
  SingleResponse,
} from '@/types';

// Courses
export const fetchCourses = async (params: Record<string, unknown> = {}) => {
  const res = await api.get<ListResponse<Course>>('/courses', { params });
  return res.data;
};

export const fetchCourse = async (idOrSlug: string) => {
  const res = await api.get<SingleResponse<Course> & { isEnrolled?: boolean }>(
    `/courses/${idOrSlug}`
  );
  return res.data;
};

export const fetchCategories = async () => {
  const res = await api.get<ListResponse<Category>>('/categories');
  return res.data;
};

// Enrollments
export const enrollFree = async (courseId: string) => {
  const res = await api.post(`/courses/${courseId}/enroll`);
  return res.data;
};

export const fetchMyEnrollments = async () => {
  const res = await api.get<ListResponse<Enrollment>>('/enrollments/me');
  return res.data;
};

export const fetchMyProgress = async (courseId: string) => {
  const res = await api.get<SingleResponse<Enrollment>>(
    `/courses/${courseId}/progress`
  );
  return res.data;
};

export const markLectureCompleted = async (
  courseId: string,
  lectureId: string
) => {
  const res = await api.post(`/courses/${courseId}/progress`, { lectureId });
  return res.data;
};

// Reviews
export const fetchCourseReviews = async (courseId: string) => {
  const res = await api.get<ListResponse<Review>>(
    `/courses/${courseId}/reviews`
  );
  return res.data;
};

// Cart
export const fetchCart = async () => {
  const res = await api.get<SingleResponse<Cart>>('/cart');
  return res.data;
};

export const addCourseToCart = async (courseId: string) => {
  const res = await api.post('/cart', { courseId });
  return res.data;
};

export const removeFromCart = async (courseId: string) => {
  const res = await api.delete(`/cart/${courseId}`);
  return res.data;
};

export const applyCouponToCart = async (code: string) => {
  const res = await api.post('/cart/apply-coupon', { code });
  return res.data;
};

export const stripeCheckout = async () => {
  const res = await api.post('/payments/checkout');
  return res.data;
};

export const freeCheckout = async () => {
  const res = await api.post('/payments/free-checkout');
  return res.data;
};

// Notifications
export const fetchNotifications = async () => {
  const res = await api.get<ListResponse<Notification>>('/notifications');
  return res.data;
};

export const unreadCount = async () => {
  const res = await api.get<{ count: number }>('/notifications/unread-count');
  return res.data;
};

// Instructor
export const fetchInstructorDashboard = async () => {
  const res = await api.get('/instructors/me/dashboard');
  return res.data;
};

export const fetchInstructorCourses = async () => {
  const res = await api.get<ListResponse<Course>>('/instructors/me/courses');
  return res.data;
};

export const fetchInstructorStudents = async () => {
  const res = await api.get('/instructors/me/students');
  return res.data;
};

// Course management (instructor)
export const createCourse = async (payload: FormData | Record<string, unknown>) => {
  const headers =
    payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined;
  const res = await api.post('/courses', payload, { headers });
  return res.data;
};

export const publishCourse = async (id: string) => {
  const res = await api.post(`/courses/${id}/publish`);
  return res.data;
};

export const createSection = async (
  courseId: string,
  data: { title: string; description?: string }
) => {
  const res = await api.post(`/courses/${courseId}/sections`, data);
  return res.data;
};

export const createLecture = async (sectionId: string, form: FormData) => {
  const res = await api.post(`/sections/${sectionId}/lectures`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

// Certificates
export const issueCertificate = async (courseId: string) => {
  const res = await api.post(`/certificates/courses/${courseId}/issue`);
  return res.data;
};

export const fetchMyCertificates = async () => {
  const res = await api.get('/certificates/me');
  return res.data;
};
