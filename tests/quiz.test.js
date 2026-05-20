require('./setup');
const request = require('supertest');
const mongoose = require('mongoose');
const buildApp = require('../app');
const Category = require('../models/categoryModel');
const Course = require('../models/courseModel');
const Quiz = require('../models/quizModel');
const Enrollment = require('../models/enrollmentModel');

const app = buildApp();

const registerAs = async (role, email) => {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({
      name: `${role} user`,
      email,
      password: 'secret123',
      passwordConfirm: 'secret123',
      role,
    });
  return res.body;
};

describe('Quiz attempts', () => {
  let instructor;
  let student;
  let course;
  let quiz;

  beforeEach(async () => {
    instructor = await registerAs('instructor', 'inst@q.com');
    student = await registerAs('student', 'stud@q.com');
    const category = await Category.create({ name: 'Programming' });
    course = await Course.create({
      title: 'Quiz course',
      slug: `quiz-${Date.now()}`,
      description: 'Course for quiz tests',
      instructor: instructor.data._id,
      category: category._id,
      isFree: true,
      price: 0,
      status: 'published',
    });
    quiz = await Quiz.create({
      title: 'Quick check',
      course: course._id,
      passingScorePercent: 60,
      questions: [
        {
          text: '2 + 2?',
          type: 'single',
          options: [
            { text: '3', isCorrect: false },
            { text: '4', isCorrect: true },
            { text: '5', isCorrect: false },
          ],
          points: 1,
        },
        {
          text: 'JS engines',
          type: 'multiple',
          options: [
            { text: 'V8', isCorrect: true },
            { text: 'SpiderMonkey', isCorrect: true },
            { text: 'PHP-FPM', isCorrect: false },
          ],
          points: 2,
        },
      ],
    });
    await Enrollment.create({
      student: student.data._id,
      course: course._id,
    });
  });

  test('student can start and submit a passing attempt', async () => {
    const start = await request(app)
      .post(`/api/v1/quizzes/${quiz._id}/attempt`)
      .set('Authorization', `Bearer ${student.accessToken}`)
      .expect(201);

    const attemptId = start.body.data._id;

    const q1 = quiz.questions[0];
    const q2 = quiz.questions[1];
    const correct1 = q1.options.find((o) => o.isCorrect)._id.toString();
    const correctSet = q2.options.filter((o) => o.isCorrect).map((o) => o._id.toString());

    const submit = await request(app)
      .post(`/api/v1/quizzes/${quiz._id}/submit`)
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send({
        attemptId,
        answers: [
          { question: q1._id.toString(), selectedOptions: [correct1] },
          { question: q2._id.toString(), selectedOptions: correctSet },
        ],
      })
      .expect(200);

    expect(submit.body.data.score).toBe(3);
    expect(submit.body.data.percent).toBe(100);
    expect(submit.body.data.passed).toBe(true);
  });

  test('failing attempt scored correctly', async () => {
    const start = await request(app)
      .post(`/api/v1/quizzes/${quiz._id}/attempt`)
      .set('Authorization', `Bearer ${student.accessToken}`);

    const q1 = quiz.questions[0];
    const wrong = q1.options.find((o) => !o.isCorrect)._id.toString();

    const submit = await request(app)
      .post(`/api/v1/quizzes/${quiz._id}/submit`)
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send({
        attemptId: start.body.data._id,
        answers: [{ question: q1._id.toString(), selectedOptions: [wrong] }],
      })
      .expect(200);

    expect(submit.body.data.score).toBe(0);
    expect(submit.body.data.passed).toBe(false);
  });

  test('unenrolled student cannot start an attempt', async () => {
    const other = await registerAs('student', 'other@q.com');
    await request(app)
      .post(`/api/v1/quizzes/${quiz._id}/attempt`)
      .set('Authorization', `Bearer ${other.accessToken}`)
      .expect(403);
  });

  test('student-facing GET strips correct answers', async () => {
    const res = await request(app)
      .get(`/api/v1/quizzes/${quiz._id}`)
      .set('Authorization', `Bearer ${student.accessToken}`)
      .expect(200);

    for (const q of res.body.data.questions) {
      for (const opt of q.options) {
        expect(opt.isCorrect).toBeUndefined();
      }
    }
  });

  test('instructor GET includes correct answers', async () => {
    const res = await request(app)
      .get(`/api/v1/quizzes/${quiz._id}`)
      .set('Authorization', `Bearer ${instructor.accessToken}`)
      .expect(200);

    const found = res.body.data.questions.some((q) =>
      q.options.some((o) => o.isCorrect === true)
    );
    expect(found).toBe(true);
  });
});
