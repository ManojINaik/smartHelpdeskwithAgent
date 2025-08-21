import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../test/server.mock.js';
import mongoose from 'mongoose';
import Ticket from '../models/Ticket.js';
import AuditLog from '../models/AuditLog.js';

describe('Audit Logging', () => {
  let agentToken: string;
  let ticketId: string;
  let traceId: string;

  beforeAll(async () => {

    const agentEmail = `agent${Date.now()}@example.com`;
    const agentReg = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Agent', email: agentEmail, password: 'Password123!', role: 'agent' });
    agentToken = agentReg.body.accessToken;

    const ticket = await Ticket.create({
      title: 'Audit test',
      description: 'Ensure logs are recorded',
      category: 'other',
      status: 'open',
      createdBy: new mongoose.Types.ObjectId()
    });
    ticketId = String(ticket._id);

    // Create a few logs
    traceId = 'trace-' + Date.now();
    await AuditLog.create({ ticketId, traceId, actor: 'system', action: 'TICKET_CREATED', meta: {}, timestamp: new Date() });
    await AuditLog.create({ ticketId, traceId, actor: 'agent', action: 'AGENT_CLASSIFIED', meta: { foo: 'bar' }, timestamp: new Date() });
  });

  afterAll(async () => {
    // Global teardown handled in setup.ts
  });

  it('filters logs by ticket', async () => {
    const res = await request(app)
      .get(`/api/audit/tickets/${ticketId}`)
      .set('Authorization', `Bearer ${agentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.logs.length).toBeGreaterThanOrEqual(2);
  });

  it('filters logs by params', async () => {
    const res = await request(app)
      .get('/api/audit')
      .set('Authorization', `Bearer ${agentToken}`)
      .query({ traceId, actor: 'agent', limit: 10 });
    expect(res.status).toBe(200);
    expect(res.body.logs.length).toBeGreaterThanOrEqual(1);
  });
});


