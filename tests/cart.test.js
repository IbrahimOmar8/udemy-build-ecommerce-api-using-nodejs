require('./setup');
const request = require('supertest');
const buildApp = require('../app');
const Category = require('../models/categoryModel');
const Course = require('../models/courseModel');
const Coupon = require('../models/couponModel');

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

describe('Cart + Coupons', () => {
  let instructor;
  let student;
  let course;

  beforeEach(async () => {
    instructor = await registerAs('instructor', 'inst@c.com');
    student = await registerAs('student', 'stud@c.com');
    const category = await Category.create({ name: 'Programming' });
    course = await Course.create({
      title: 'Paid course',
      slug: `paid-${Date.now()}`,
      description: 'Paid course for cart tests',
      instructor: instructor.data._id,
      category: category._id,
      price: 100,
      status: 'published',
    });
  });

  test('empty cart returns an empty list', async () => {
    const res = await request(app)
      .get('/api/v1/cart')
      .set('Authorization', `Bearer ${student.accessToken}`)
      .expect(200);
    expect(res.body.data.items).toEqual([]);
  });

  test('add course to cart', async () => {
    const res = await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send({ courseId: course._id.toString() })
      .expect(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.totalPrice).toBe(100);
  });

  test('apply percent coupon', async () => {
    await Coupon.create({
      code: 'TEST20',
      discountType: 'percent',
      discountValue: 20,
      expireAt: new Date(Date.now() + 86400000),
      appliesTo: 'all',
      isActive: true,
    });
    await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send({ courseId: course._id.toString() });

    const res = await request(app)
      .post('/api/v1/cart/apply-coupon')
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send({ code: 'TEST20' })
      .expect(200);

    expect(res.body.data.totalAfterDiscount).toBe(80);
  });

  test('expired coupon rejected', async () => {
    await Coupon.create({
      code: 'OLD',
      discountType: 'percent',
      discountValue: 50,
      expireAt: new Date(Date.now() - 86400000),
      appliesTo: 'all',
      isActive: true,
    });
    await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send({ courseId: course._id.toString() });

    await request(app)
      .post('/api/v1/cart/apply-coupon')
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send({ code: 'OLD' })
      .expect(400);
  });

  test('remove course from cart', async () => {
    await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send({ courseId: course._id.toString() });
    const res = await request(app)
      .delete(`/api/v1/cart/${course._id}`)
      .set('Authorization', `Bearer ${student.accessToken}`)
      .expect(200);
    expect(res.body.data.items).toHaveLength(0);
  });
});
