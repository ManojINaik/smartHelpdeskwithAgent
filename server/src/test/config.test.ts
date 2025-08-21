import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../test/server.mock.js';
import mongoose from 'mongoose';

describe('Config API', () => {
  let adminToken: string;

  beforeAll(async () => {

    const adminEmail = `admin${Date.now()}@example.com`;
    const adminReg = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Admin', email: adminEmail, password: 'Password123!', role: 'admin' });
    adminToken = adminReg.body.accessToken;
  });

  afterAll(async () => {
    // Global teardown handled in setup.ts
  });

  it('returns effective config', async () => {
    const res = await request(app)
      .get('/api/config')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.config).toBeTruthy();
    expect(typeof res.body.config.confidenceThreshold).toBe('number');
  });

  it('updates config as admin', async () => {
    const res = await request(app)
      .put('/api/config')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ confidenceThreshold: 0.85, autoCloseEnabled: true });
    expect(res.status).toBe(200);
    expect(res.body.config.confidenceThreshold).toBe(0.85);
  });
});


