import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth.js';
import User from '../models/User.js';
import Ticket from '../models/Ticket.js';
import AgentSuggestion from '../models/AgentSuggestion.js';

const router = Router();

// List users (admin only)
router.get('/users', authenticate, authorize(['admin']), async (_req, res) => {
  const users = await User.find({}, 'name email role createdAt').sort({ createdAt: -1 });
  res.json({ users });
});

// Update user role (admin only)
const roleSchema = z.object({ role: z.enum(['admin','agent','user']) });
router.put('/users/:id/role', authenticate, authorize(['admin']), async (req, res): Promise<void> => {
  const { role } = roleSchema.parse(req.body);
  const updated = await User.findByIdAndUpdate(req.params.id, { role }, { new: true, runValidators: true }).select('name email role');
  if (!updated) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } }); return; }
  res.json({ user: updated });
});

// System metrics (admin)
router.get('/metrics', authenticate, authorize(['admin']), async (_req, res) => {
  const [ticketCounts, suggestionMetrics, userCounts] = await Promise.all([
    Ticket.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    (AgentSuggestion as any).getPerformanceMetrics(),
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }])
  ]);

  res.json({
    tickets: ticketCounts,
    suggestions: suggestionMetrics,
    users: userCounts
  });
});

export default router;


