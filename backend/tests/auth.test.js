const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');

describe('Auth', () => {
  const email = 'testuser@example.com';
  const password = 'testpass';
  test('register and login flow', async () => {
    await db.query("DELETE FROM users WHERE email=$1", [email]);
    const r = await request(app).post('/api/auth/register').send({ email, password, role: 'seller' });
    expect(r.statusCode).toBe(201);
    const login = await request(app).post('/api/auth/login').send({ email, password });
    expect(login.statusCode).toBe(200);
    expect(login.body.token).toBeTruthy();
  });
});
