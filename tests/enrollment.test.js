require('./setup');
const request = require('supertest');
const buildApp = require('../app');
const Category = require('../models/categoryModel');
const Course = require('../models/courseModel');
const Section = require('../models/sectionModel');
const Lecture = require('../models/lectureModel');

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

describe('Enrollment + Progress', () => {
  let instructor;
  let student;
  let course;
  let lecture;

  beforeEach(async () => {
    instructor = await registerAs('instructor', 'inst@e.com');
    student = await registerAs('student', 'stud@e.com');
    const category = await Category.create({ name: 'Programming' });
    course = await Course.create({
      title: 'Free intro course',
      slug: `free-intro-${Date.now()}`,
      description: 'Free course for testing enrollment flow',
      instructor: instructor.data._id,
      category: category._id,
      isFree: true,
      price: 0,
      status: 'published',
    });
    const section = await Section.create({
      title: 'Intro',
      course: course._id,
      order: 0,
    });
    lecture = await Lecture.create({
      title: 'Welcome',
      section: section._id,
      course: course._id,
      order: 0,
      type: 'video',
      durationSeconds: 120,
    });
  });

  test('student can enroll in a free course', async () => {
    const res = await request(app)
      .post(`/api/v1/courses/${course._id}/enroll`)
      .set('Authorization', `Bearer ${student.accessToken}`)
      .expect(201);
    expect(res.body.data.student).toBe(student.data._id);
  });

  test('double enrollment rejected', async () => {
    await request(app)
      .post(`/api/v1/courses/${course._id}/enroll`)
      .set('Authorization', `Bearer ${student.accessToken}`)
      .expect(201);
    await request(app)
      .post(`/api/v1/courses/${course._id}/enroll`)
      .set('Authorization', `Bearer ${student.accessToken}`)
      .expect(400);
  });

  test('mark lecture completed updates progress', async () => {
    await request(app)
      .post(`/api/v1/courses/${course._id}/enroll`)
      .set('Authorization', `Bearer ${student.accessToken}`);

    const progress = await request(app)
      .post(`/api/v1/courses/${course._id}/progress`)
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send({ lectureId: lecture._id.toString() })
      .expect(200);

    expect(progress.body.data.progressPercent).toBe(100);
    expect(progress.body.data.completedLectures).toHaveLength(1);
  });

  test('cannot mark progress without enrollment', async () => {
    await request(app)
      .post(`/api/v1/courses/${course._id}/progress`)
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send({ lectureId: lecture._id.toString() })
      .expect(403);
  });

  test('GET /enrollments/me returns student enrollments', async () => {
    await request(app)
      .post(`/api/v1/courses/${course._id}/enroll`)
      .set('Authorization', `Bearer ${student.accessToken}`);

    const res = await request(app)
      .get('/api/v1/enrollments/me')
      .set('Authorization', `Bearer ${student.accessToken}`)
      .expect(200);

    expect(res.body.results).toBe(1);
    expect(res.body.data[0].course._id).toBe(course._id.toString());
  });
});
