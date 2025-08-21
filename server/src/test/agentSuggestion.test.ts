import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../test/server.mock.js';
import mongoose from 'mongoose';
import Ticket from '../models/Ticket.js';

describe('Agent Suggestion Decision', () => {
  let agentToken: string;
  let ticketId: string;

  beforeAll(async () => {
    process.env.LLM_PROVIDER = 'stub';
    process.env.STUB_MODE = 'true';

    const agentEmail = `agent${Date.now()}@example.com`;
    const agentReg = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Agent', email: agentEmail, password: 'Password123!', role: 'agent' });
    agentToken = agentReg.body.accessToken;

    const ticket = await Ticket.create({
      title: 'App shows 500 on login',
      description: 'Stack trace mentions auth module',
      category: 'other',
      status: 'open',
      createdBy: new mongoose.Types.ObjectId()
    });
    ticketId = String(ticket._id);
  });

  afterAll(async () => {
    // Global teardown handled in setup.ts
  });

  it('can triage and get suggestion', async () => {
    const triage = await request(app)
      .post('/api/agent/triage')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ ticketId });
    expect(triage.status).toBe(200);

    const gets = await request(app)
      .get(`/api/agent/suggestion/${ticketId}`)
      .set('Authorization', `Bearer ${agentToken}`);
    expect(gets.status).toBe(200);
    expect(gets.body.suggestion).toBeTruthy();
  });

  it('agent can accept suggestion and resolve ticket', async () => {
    const accept = await request(app)
      .post('/api/agent/suggestion/accept')
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ ticketId, editedReply: 'Edited reply' });
    expect(accept.status).toBe(200);
    expect(accept.body.ticket.status).toBe('resolved');
  });
});


