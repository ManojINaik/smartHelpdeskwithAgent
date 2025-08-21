import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth.js';
import User from '../models/User.js';
import Ticket from '../models/Ticket.js';
import AgentSuggestion from '../models/AgentSuggestion.js';
import UserService from '../services/user.service.js';

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

// Check if user can be deleted (admin only)
router.get('/users/:id/deletion-check', authenticate, authorize(['admin']), async (req, res): Promise<void> => {
  try {
    const userId = req.params.id;
    if (!userId) {
      res.status(400).json({ error: { code: 'INVALID_USER_ID', message: 'User ID is required' } });
      return;
    }
    const result = await UserService.canDeleteUser(userId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: { code: 'DELETION_CHECK_FAILED', message: err.message } });
  }
});

// Get user statistics (admin only)
router.get('/users/:id/stats', authenticate, authorize(['admin']), async (req, res): Promise<void> => {
  try {
    const userId = req.params.id;
    if (!userId) {
      res.status(400).json({ error: { code: 'INVALID_USER_ID', message: 'User ID is required' } });
      return;
    }
    const stats = await UserService.getUserStats(userId);
    res.json({ stats });
  } catch (err: any) {
    res.status(400).json({ error: { code: 'USER_STATS_FAILED', message: err.message } });
  }
});

// Delete user (admin only)
const deleteUserSchema = z.object({
  transferOwnership: z.boolean().optional().default(true),
  deleteAssociatedData: z.boolean().optional().default(false),
  systemUserId: z.string().optional()
});

router.delete('/users/:id', authenticate, authorize(['admin']), async (req, res): Promise<void> => {
  try {
    const userId = req.params.id;
    if (!userId) {
      res.status(400).json({ error: { code: 'INVALID_USER_ID', message: 'User ID is required' } });
      return;
    }
    
    const options = deleteUserSchema.parse(req.body);
    const result = await UserService.deleteUser(
      userId,
      req.user!.sub,
      options
    );
    
    if (!result.success) {
      res.status(400).json({ 
        error: { 
          code: 'USER_DELETION_FAILED', 
          message: 'Failed to delete user',
          details: result.errors 
        } 
      });
      return;
    }
    
    res.json({ 
      message: 'User deleted successfully',
      result: {
        deletedUserId: result.deletedUserId,
        ticketsAffected: result.ticketsAffected,
        articlesAffected: result.articlesAffected,
        repliesAffected: result.repliesAffected,
        transferredToSystemUser: result.transferredToSystemUser
      }
    });
  } catch (err: any) {
    res.status(400).json({ error: { code: 'USER_DELETION_FAILED', message: err.message } });
  }
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


