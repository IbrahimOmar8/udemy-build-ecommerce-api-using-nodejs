require('./setup');
const request = require('supertest');
const buildApp = require('../app');

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

describe('Direct messaging', () => {
  let instructor;
  let student;

  beforeEach(async () => {
    instructor = await registerAs('instructor', 'inst@m.com');
    student = await registerAs('student', 'stud@m.com');
  });

  test('student can send message to instructor and conversation appears', async () => {
    const send = await request(app)
      .post('/api/v1/messages')
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send({ recipientId: instructor.data._id, body: 'Hi, quick question' })
      .expect(201);

    expect(send.body.data.conversationId).toBeDefined();

    const list = await request(app)
      .get('/api/v1/messages/conversations')
      .set('Authorization', `Bearer ${student.accessToken}`)
      .expect(200);
    expect(list.body.results).toBe(1);

    const instructorList = await request(app)
      .get('/api/v1/messages/conversations')
      .set('Authorization', `Bearer ${instructor.accessToken}`)
      .expect(200);
    expect(instructorList.body.data[0].unreadCount).toBe(1);
  });

  test('reading a conversation clears unread count', async () => {
    const send = await request(app)
      .post('/api/v1/messages')
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send({ recipientId: instructor.data._id, body: 'hello' });

    await request(app)
      .get(`/api/v1/messages/conversations/${send.body.data.conversationId}`)
      .set('Authorization', `Bearer ${instructor.accessToken}`)
      .expect(200);

    const unread = await request(app)
      .get('/api/v1/messages/unread-count')
      .set('Authorization', `Bearer ${instructor.accessToken}`)
      .expect(200);
    expect(unread.body.count).toBe(0);
  });

  test('cannot send a message to yourself', async () => {
    await request(app)
      .post('/api/v1/messages')
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send({ recipientId: student.data._id, body: 'hi me' })
      .expect(400);
  });
});
