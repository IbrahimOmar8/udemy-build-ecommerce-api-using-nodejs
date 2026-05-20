import { api } from './api';

export interface Qna {
  _id: string;
  title: string;
  body: string;
  course: string;
  lecture?: string;
  user: { _id: string; name: string; profileImg?: string; role: string };
  answers: Answer[];
  upvotes: number;
  upvoters: string[];
  isResolved: boolean;
  createdAt: string;
}

export interface Answer {
  _id: string;
  user: { _id: string; name: string; profileImg?: string; role: string };
  text: string;
  isInstructor: boolean;
  upvotes: number;
  createdAt: string;
}

export const fetchCourseQna = async (courseId: string) => {
  const res = await api.get<{ results: number; data: Qna[] }>(
    `/courses/${courseId}/qna`
  );
  return res.data;
};

export const askQuestion = async (
  courseId: string,
  data: { title: string; body: string; lecture?: string }
) => {
  const res = await api.post(`/courses/${courseId}/qna`, data);
  return res.data;
};

export const replyToQna = async (qnaId: string, text: string) => {
  const res = await api.post(`/qna/${qnaId}/answers`, { text });
  return res.data;
};

export const upvoteQna = async (qnaId: string) => {
  const res = await api.post(`/qna/${qnaId}/upvote`);
  return res.data;
};

export const fetchQna = async (qnaId: string) => {
  const res = await api.get<{ data: Qna }>(`/qna/${qnaId}`);
  return res.data;
};
