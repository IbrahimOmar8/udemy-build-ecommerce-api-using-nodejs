require('./setup');
const request = require('supertest');
const buildApp = require('../app');

const app = buildApp();

describe('Auth flow', () => {
  const validUser = {
    name: 'Test Student',
    email: 'student@test.com',
    password: 'secret123',
    passwordConfirm: 'secret123',
  };

  test('register issues access and refresh tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(validUser)
      .expect(201);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.data.email).toBe(validUser.email);
    expect(res.body.data.role).toBe('student');
  });

  test('register as instructor sets role + unapproved', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...validUser, email: 'inst@test.com', role: 'instructor' })
      .expect(201);

    expect(res.body.data.role).toBe('instructor');
    expect(res.body.data.instructorProfile.approved).toBe(false);
  });

  test('register rejects duplicate email', async () => {
    await request(app).post('/api/v1/auth/register').send(validUser).expect(201);
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(validUser)
      .expect(400);
    expect(res.body.errors).toBeDefined();
  });

  test('login succeeds and refresh token works', async () => {
    await request(app).post('/api/v1/auth/register').send(validUser);
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: validUser.password })
      .expect(200);

    expect(login.body.accessToken).toBeDefined();

    const refresh = await request(app)
      .post('/api/v1/auth/refresh-token')
      .send({ refreshToken: login.body.refreshToken })
      .expect(200);

    expect(refresh.body.accessToken).toBeDefined();
  });

  test('login rejects wrong password', async () => {
    await request(app).post('/api/v1/auth/register').send(validUser);
    await request(app)
      .post('/api/v1/auth/login')
      .send({ email: validUser.email, password: 'wrong-pass' })
      .expect(401);
  });

  test('/auth/me returns current user', async () => {
    const reg = await request(app).post('/api/v1/auth/register').send(validUser);
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${reg.body.accessToken}`)
      .expect(200);
    expect(res.body.data.email).toBe(validUser.email);
  });

  test('protected route rejects missing token', async () => {
    await request(app).get('/api/v1/users/me').expect(401);
  });
});
