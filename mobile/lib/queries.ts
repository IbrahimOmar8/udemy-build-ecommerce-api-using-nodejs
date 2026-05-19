import { api } from './api';
import type { Course, Enrollment, ListResponse } from '@/types';

export const fetchCourses = async (params: Record<string, unknown> = {}) => {
  const res = await api.get<ListResponse<Course>>('/courses', { params });
  return res.data;
};

export const fetchCourse = async (idOrSlug: string) => {
  const res = await api.get<{ data: Course; isEnrolled?: boolean }>(
    `/courses/${idOrSlug}`
  );
  return res.data;
};

export const fetchMyEnrollments = async () => {
  const res = await api.get<ListResponse<Enrollment>>('/enrollments/me');
  return res.data;
};

export const fetchMyProgress = async (courseId: string) => {
  const res = await api.get<{ data: Enrollment }>(
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

export const enrollFree = async (courseId: string) => {
  const res = await api.post(`/courses/${courseId}/enroll`);
  return res.data;
};

export const fetchLecture = async (lectureId: string) => {
  const res = await api.get(`/lectures/${lectureId}`);
  return res.data.data;
};
