import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../test/server.mock.js';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('KB API', () => {
  let mongoServer: MongoMemoryServer;
  let adminToken: string;
  let userToken: string;
  let articleId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({ binary: { version: '7.0.14' } });
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    await mongoose.connect(uri);

    const adminEmail = `admin${Date.now()}@example.com`;
    const userEmail = `user${Date.now()}@example.com`;

    const adminReg = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Admin', email: adminEmail, password: 'Password123!', role: 'admin' });
    adminToken = adminReg.body.accessToken;

    const userReg = await request(app)
      .post('/api/auth/register')
      .send({ name: 'User', email: userEmail, password: 'Password123!' });
    userToken = userReg.body.accessToken;
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  it('admin can create article', async () => {
    const res = await request(app)
      .post('/api/kb')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Troubleshooting 500 errors', body: 'Steps...', tags: ['tech','errors'], status: 'published' });
    expect(res.status).toBe(201);
    articleId = res.body.article._id;
  });

  it('non-admin cannot create article', async () => {
    const res = await request(app)
      .post('/api/kb')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'User Article', body: 'Nope' });
    expect(res.status).toBe(403);
  });

  it('search returns published article', async () => {
    const res = await request(app).get('/api/kb').query({ query: '500 errors' });
    expect(res.status).toBe(200);
    expect(res.body.results.length).toBeGreaterThan(0);
  });

  it('admin can update article', async () => {
    const res = await request(app)
      .put(`/api/kb/${articleId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Troubleshooting server errors' });
    expect(res.status).toBe(200);
    expect(res.body.article.title).toContain('server');
  });
});



