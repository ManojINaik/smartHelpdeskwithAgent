import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth.js';
import AuditLog from '../models/AuditLog.js';

const router = Router();

// GET /api/audit?ticketId=...&traceId=...&actor=...&action=...&from=iso&to=iso&limit=50
router.get('/', authenticate, authorize(['admin', 'agent']), async (req, res) => {
  const schema = z.object({
    ticketId: z.string().optional(),
    traceId: z.string().optional(),
    actor: z.enum(['system','agent','user']).optional(),
    action: z.string().optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    limit: z.coerce.number().min(1).max(200).default(50),
  });

  const params = schema.parse(req.query);
  const filter: any = {};
  if (params.ticketId) filter.ticketId = params.ticketId;
  if (params.traceId) filter.traceId = params.traceId;
  if (params.actor) filter.actor = params.actor;
  if (params.action) filter.action = params.action.toUpperCase();
  if (params.from || params.to) {
    filter.timestamp = {} as any;
    if (params.from) (filter.timestamp as any).$gte = new Date(params.from);
    if (params.to) (filter.timestamp as any).$lte = new Date(params.to);
  }

  const logs = await AuditLog.find(filter).sort({ timestamp: -1 }).limit(params.limit);
  res.json({ logs });
});

// GET /api/tickets/:id/audit trail (chronological)
router.get('/tickets/:id', authenticate, async (req, res) => {
  const logs = await AuditLog.find({ ticketId: req.params.id }).sort({ timestamp: 1 });
  res.json({ logs });
});

export default router;


