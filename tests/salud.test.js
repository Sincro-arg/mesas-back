const request = require('supertest');
const app = require('../src/app');

describe('GET /salud', () => {
  it('responde ok:true', async () => {
    const res = await request(app).get('/salud');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
