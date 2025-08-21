import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from './server.mock.js';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('E2E - Triage workflow', () => {
  let mongoServer: MongoMemoryServer;
  let userToken: string;
  let agentToken: string;
  let ticketId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({ binary: { version: '7.0.14' } });
    const uri = mongoServer.getUri();
    process.env.MONGODB_URI = uri;
    process.env.LLM_PROVIDER = 'stub';
    process.env.STUB_MODE = 'true';
    await mongoose.connect(uri);

    const userEmail = `user${Date.now()}@example.com`;
    const agentEmail = `agent${Date.now()}@example.com`;

    const userReg = await request(app).post('/api/auth/register').send({ name: 'User', email: userEmail, password: 'Password123!' });
    userToken = userReg.body.accessToken;
    const agentReg = await request(app).post('/api/auth/register').send({ name: 'Agent', email: agentEmail, password: 'Password123!', role: 'agent' });
    agentToken = agentReg.body.accessToken;
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  it('creates a ticket, triggers triage, and persists suggestion', async () => {
    const create = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ title: 'Refund for double charge', description: 'I was charged twice for order #1234' });
    expect(create.status).toBe(201);
    ticketId = create.body.ticket._id;

    // Poll suggestion endpoint with small delay
    let suggestion: any = null;
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 200));
      const res = await request(app)
        .get(`/api/agent/suggestion/${ticketId}`)
        .set('Authorization', `Bearer ${agentToken}`);
      if (res.status === 200) { suggestion = res.body.suggestion; break; }
    }
    expect(suggestion).toBeTruthy();
    expect(suggestion.ticketId).toBe(ticketId);
  });
});


