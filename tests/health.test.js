require('./setup');
const request = require('supertest');
const buildApp = require('../app');

const app = buildApp();

describe('Health check', () => {
  test('GET /api/v1/health returns ok', async () => {
    const res = await request(app).get('/api/v1/health').expect(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptime).toBe('number');
  });

  test('Unknown route returns 404', async () => {
    const res = await request(app).get('/api/v1/no-such-route').expect(404);
    expect(res.body.status).toBe('fail');
  });
});
