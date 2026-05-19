require('./setup');
const request = require('supertest');
const buildApp = require('../app');
const Category = require('../models/categoryModel');

const app = buildApp();

const registerAs = async (role, email = `${role}@test.com`) => {
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

describe('Course lifecycle', () => {
  let instructor;
  let student;
  let category;

  beforeEach(async () => {
    instructor = await registerAs('instructor', 'inst1@test.com');
    student = await registerAs('student', 'stud1@test.com');
    category = await Category.create({ name: 'Programming' });
  });

  test('instructor can create a course', async () => {
    const res = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${instructor.accessToken}`)
      .send({
        title: 'Node.js Bootcamp',
        description: 'Full bootcamp on Node.js backend development',
        category: category._id.toString(),
        price: 49.99,
        level: 'beginner',
      })
      .expect(201);

    expect(res.body.data.title).toBe('Node.js Bootcamp');
    expect(res.body.data.status).toBe('draft');
    const instructorId =
      typeof res.body.data.instructor === 'string'
        ? res.body.data.instructor
        : res.body.data.instructor._id;
    expect(instructorId).toBe(instructor.data._id);
  });

  test('student cannot create a course', async () => {
    await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send({
        title: 'Hack attempt',
        description: 'Should not work',
        category: category._id.toString(),
      })
      .expect(403);
  });

  test('public listing hides drafts', async () => {
    await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${instructor.accessToken}`)
      .send({
        title: 'Draft Course',
        description: 'In draft state',
        category: category._id.toString(),
      });

    const res = await request(app).get('/api/v1/courses').expect(200);
    expect(res.body.results).toBe(0);
  });

  test('cannot enroll in unpublished course', async () => {
    const course = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${instructor.accessToken}`)
      .send({
        title: 'Draft',
        description: 'still draft',
        category: category._id.toString(),
        isFree: true,
      });

    await request(app)
      .post(`/api/v1/courses/${course.body.data._id}/enroll`)
      .set('Authorization', `Bearer ${student.accessToken}`)
      .expect(400);
  });
});
