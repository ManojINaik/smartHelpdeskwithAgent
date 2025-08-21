import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../test/server.mock.js';
import mongoose from 'mongoose';

describe('Auth API', () => {

  beforeAll(async () => {
    // Global MongoDB is started in setup.ts
  });

  afterAll(async () => {
    // Global teardown handled in setup.ts
  });
  let email = `user${Date.now()}@example.com`;
  const password = 'Password123!';

  it('registers a new user and returns tokens', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email, password });
    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
    expect(res.body.user.email).toBe(email);
  });

  it('logs in an existing user and returns tokens', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
    expect(res.body.user.email).toBe(email);
  });

  it('validates access token via /me', async () => {
    const login = await request(app).post('/api/auth/login').send({ email, password });
    const token = login.body.accessToken;
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email);
  });

  it('enforces RBAC on admin route', async () => {
    // Regular user should get forbidden
    const login = await request(app).post('/api/auth/login').send({ email, password });
    const userToken = login.body.accessToken;
    const forbidden = await request(app).get('/api/secure/admin').set('Authorization', `Bearer ${userToken}`);
    expect(forbidden.status).toBe(403);

    // Register admin and access
    const adminEmail = `admin${Date.now()}@example.com`;
    const adminReg = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Admin', email: adminEmail, password, role: 'admin' });
    const adminToken = adminReg.body.accessToken;
    const allowed = await request(app).get('/api/secure/admin').set('Authorization', `Bearer ${adminToken}`);
    expect(allowed.status).toBe(200);
    expect(allowed.body.ok).toBe(true);
  });
});


