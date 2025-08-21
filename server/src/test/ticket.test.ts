import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../test/server.mock.js';
import mongoose from 'mongoose';

describe('Ticket API', () => {
  let userToken: string;
  let agentToken: string;
  let ticketId: string;

  beforeAll(async () => {

    const userEmail = `user${Date.now()}@example.com`;
    const agentEmail = `agent${Date.now()}@example.com`;

    const userReg = await request(app)
      .post('/api/auth/register')
      .send({ name: 'User', email: userEmail, password: 'Password123!' });
    userToken = userReg.body.accessToken;

    const agentReg = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Agent', email: agentEmail, password: 'Password123!', role: 'agent' });
    agentToken = agentReg.body.accessToken;
  });

  afterAll(async () => {
    // Global teardown handled in setup.ts
  });

  it('user can create a ticket with attachments', async () => {
    const dataUrl = 'data:text/plain;base64,' + Buffer.from('Attachment text content').toString('base64');
    const res = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Refund for double charge',
        description: 'I was charged twice for order #1234',
        category: 'other',
        attachmentUrls: [dataUrl]
      });
    expect(res.status).toBe(201);
    ticketId = res.body.ticket._id;
  });

  it('lists my tickets', async () => {
    const res = await request(app)
      .get('/api/tickets')
      .set('Authorization', `Bearer ${userToken}`)
      .query({ my: true });
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
  });

  it('agent can assign a ticket', async () => {
    const agentPayload = JSON.parse(Buffer.from(agentToken.split('.')[1], 'base64').toString());
    const res = await request(app)
      .post(`/api/tickets/${ticketId}/assign`)
      .set('Authorization', `Bearer ${agentToken}`)
      .send({ assigneeId: agentPayload.id || agentPayload.sub });
    expect(res.status).toBe(200);
    expect(res.body.ticket.assignee).toBeTruthy();
  });

  it('user can reply to ticket', async () => {
    const res = await request(app)
      .post(`/api/tickets/${ticketId}/reply`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ content: 'Thanks for the quick support!' });
    expect(res.status).toBe(200);
    expect(res.body.ticket.replies.length).toBeGreaterThan(0);
  });
});


