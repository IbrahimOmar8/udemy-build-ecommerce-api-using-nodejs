require('./setup');
const request = require('supertest');
const buildApp = require('../app');
const Category = require('../models/categoryModel');
const Course = require('../models/courseModel');
const Enrollment = require('../models/enrollmentModel');
const Payment = require('../models/paymentModel');

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

describe('Refunds (30-day money-back guarantee)', () => {
  let instructor;
  let student;
  let course;
  let enrollment;

  beforeEach(async () => {
    instructor = await registerAs('instructor', 'inst@r.com');
    student = await registerAs('student', 'stud@r.com');
    const category = await Category.create({ name: 'Programming' });
    course = await Course.create({
      title: 'Paid course',
      slug: `paid-r-${Date.now()}`,
      description: 'desc',
      instructor: instructor.data._id,
      category: category._id,
      price: 50,
      status: 'published',
    });
    const payment = await Payment.create({
      user: student.data._id,
      items: [{ course: course._id, price: 50, title: course.title }],
      totalAmount: 50,
      paymentMethod: 'manual',
      paymentStatus: 'paid',
      paidAt: new Date(),
    });
    enrollment = await Enrollment.create({
      student: student.data._id,
      course: course._id,
      pricePaid: 50,
      paymentId: payment._id,
    });
  });

  test('eligibility endpoint returns eligible for fresh paid enrollment', async () => {
    const res = await request(app)
      .get(`/api/v1/payments/refund-eligibility/${enrollment._id}`)
      .set('Authorization', `Bearer ${student.accessToken}`)
      .expect(200);
    expect(res.body.eligible).toBe(true);
    expect(res.body.daysLeft).toBe(30);
  });

  test('refund succeeds and removes the enrollment', async () => {
    const res = await request(app)
      .post('/api/v1/payments/refund')
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send({ enrollmentId: enrollment._id, reason: 'Not what I expected' })
      .expect(200);
    expect(res.body.refundAmount).toBe(50);

    const stillEnrolled = await Enrollment.findById(enrollment._id);
    expect(stillEnrolled).toBeNull();
  });

  test('refund rejected when progress > 30%', async () => {
    enrollment.progressPercent = 80;
    await enrollment.save();
    await request(app)
      .post('/api/v1/payments/refund')
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send({ enrollmentId: enrollment._id })
      .expect(400);
  });

  test('refund rejected for free enrollment', async () => {
    enrollment.pricePaid = 0;
    await enrollment.save();
    await request(app)
      .post('/api/v1/payments/refund')
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send({ enrollmentId: enrollment._id })
      .expect(400);
  });
});
