import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { validateEnv } from '../config/env.js';
import authRoutes from '../routes/auth.routes.js';
import kbRoutes from '../routes/kb.routes.js';
import ticketRoutes from '../routes/ticket.routes.js';
import agentRoutes from '../routes/agent.routes.js';
import auditRoutes from '../routes/audit.routes.js';
import configRoutes from '../routes/config.routes.js';
// Avoid importing ws in tests
vi.mock('../services/notify.service.js', () => ({ __esModule: true, default: { init: () => {}, broadcastToUser: () => {} } }));
import { authenticate, authorize } from '../middleware/auth.js';

dotenv.config({ path: '.env.test' });
validateEnv();

const app = express();
app.use(helmet());
app.use(cors({ origin: '*'}));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/kb', kbRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/config', configRoutes);

// Protected test route for RBAC validation
app.get('/api/secure/admin', authenticate, authorize(['admin']), (req, res) => {
  res.json({ ok: true });
});

export default app;


