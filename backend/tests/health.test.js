const request = require('supertest');
const { createApp } = require('../src/app');

describe('GET /health', () => {
  const app = createApp();

  it('returns 200 and a status payload', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'ok',
      service: 'silas-mobiles-backend',
    });
    expect(typeof res.body.timestamp).toBe('string');
  });
});

describe('unknown route', () => {
  const app = createApp();

  it('returns a JSON 404', async () => {
    const res = await request(app).get('/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });
});
