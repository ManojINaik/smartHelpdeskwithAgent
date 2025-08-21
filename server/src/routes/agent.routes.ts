import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth.js';
import WorkflowOrchestrator from '../services/agent/workflow.js';
import AgentSuggestion from '../models/AgentSuggestion.js';
import AgentSuggestionService from '../services/agentSuggestion.service.js';
import Ticket from '../models/Ticket.js';
import User from '../models/User.js';
import AuditLogService from '../services/audit.service.js';
import Notifications from '../services/notify.service.js';
import EscalationService from '../services/escalation.service.js';
import { getEnvConfig } from '../config/env.js';

const router = Router();
const orchestrator = new WorkflowOrchestrator();

const triageSchema = z.object({ ticketId: z.string().min(1) });

// Internal triage trigger (protect: agent/admin)
router.post('/triage', authenticate, authorize(['admin', 'agent']), async (req, res) => {
  try {
    const { ticketId } = triageSchema.parse(req.body);
    const ctx = await orchestrator.triageTicket(ticketId);
    res.json({ context: ctx });
  } catch (err: any) {
    res.status(400).json({ error: { code: 'TRIAGE_FAILED', message: err.message } });
  }
});

router.get('/suggestion/:ticketId', authenticate, authorize(['admin', 'agent']), async (req, res): Promise<void> => {
  const suggestion = await AgentSuggestion.findOne({ ticketId: req.params.ticketId });
  if (!suggestion) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Suggestion not found' } }); return; }
  res.json({ suggestion });
});

// Accept suggestion and send reply (agent action)
const acceptSchema = z.object({
  ticketId: z.string().min(1),
  editedReply: z.string().optional()
});
router.post('/suggestion/accept', authenticate, authorize(['admin', 'agent']), async (req, res): Promise<void> => {
  try {
    const { ticketId, editedReply } = acceptSchema.parse(req.body);
    const result = await AgentSuggestionService.acceptSuggestion(ticketId, req.user!.sub, editedReply, req.traceId);
    if (!result) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket or suggestion not found' } }); return; }
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: { code: 'SUGGESTION_ACCEPT_FAILED', message: err.message } });
  }
});

// Reject suggestion and keep waiting_human (agent action)
const rejectSchema = z.object({ ticketId: z.string().min(1) });
router.post('/suggestion/reject', authenticate, authorize(['admin', 'agent']), async (req, res): Promise<void> => {
  try {
    const { ticketId } = rejectSchema.parse(req.body);
    const result = await AgentSuggestionService.rejectSuggestion(ticketId, req.user!.sub, req.traceId);
    if (!result) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket or suggestion not found' } }); return; }
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: { code: 'SUGGESTION_REJECT_FAILED', message: err.message } });
  }
});

// Batch process pending tickets (admin only)
const batchProcessSchema = z.object({
  ticketIds: z.array(z.string()).min(1).max(50), // Limit batch size
  forceRetriage: z.boolean().optional().default(false)
});
router.post('/batch/triage', authenticate, authorize(['admin']), async (req, res): Promise<void> => {
  try {
    const { ticketIds, forceRetriage } = batchProcessSchema.parse(req.body);
    
    // Validate tickets exist and are in appropriate state
    const tickets = await Ticket.find({ 
      _id: { $in: ticketIds },
      status: forceRetriage ? { $in: ['open', 'triaged', 'waiting_human'] } : { $in: ['open'] }
    });
    
    if (tickets.length === 0) {
      res.status(400).json({ error: { code: 'NO_VALID_TICKETS', message: 'No valid tickets found for processing' } });
      return;
    }
    
    const validTicketIds = tickets.map(t => String(t._id));
    
    // Process batch asynchronously
    const orchestrator = new WorkflowOrchestrator();
    orchestrator.processTicketsBatch(validTicketIds).then(results => {
      console.log(`Batch processing completed for ${results.length} tickets`);
    }).catch(error => {
      console.error('Batch processing failed:', error);
    });
    
    await AuditLogService.log('batch', req.traceId || 'n/a', 'system', 'BATCH_TRIAGE_STARTED', {
      initiatedBy: req.user!.sub,
      ticketCount: validTicketIds.length,
      forceRetriage
    });
    
    res.json({ 
      message: 'Batch processing started',
      ticketCount: validTicketIds.length,
      processedTickets: validTicketIds
    });
  } catch (err: any) {
    res.status(400).json({ error: { code: 'BATCH_PROCESS_FAILED', message: err.message } });
  }
});

// Auto-assign unassigned tickets (admin/agent)
const autoAssignSchema = z.object({
  category: z.enum(['billing', 'tech', 'shipping', 'other']).optional(),
  maxTickets: z.number().min(1).max(20).optional().default(10)
});
router.post('/auto-assign', authenticate, authorize(['admin', 'agent']), async (req, res): Promise<void> => {
  try {
    const { category, maxTickets } = autoAssignSchema.parse(req.body);
    
    // Find unassigned tickets
    const query: any = {
      assignee: null,
      status: { $in: ['waiting_human', 'triaged'] }
    };
    
    if (category) {
      // Look for tickets with matching category in suggestions
      const suggestions = await AgentSuggestion.find({ predictedCategory: category }).select('ticketId');
      const ticketIds = suggestions.map(s => s.ticketId);
      query._id = { $in: ticketIds };
    }
    
    const unassignedTickets = await Ticket.find(query)
      .limit(maxTickets)
      .sort({ createdAt: 1 }); // Oldest first
    
    if (unassignedTickets.length === 0) {
      res.json({ message: 'No unassigned tickets found', assignedCount: 0 });
      return;
    }
    
    // Find available agents
    const agents = await User.find({
      role: { $in: ['admin', 'agent'] },
      isActive: { $ne: false }
    }).select('_id name role');
    
    if (agents.length === 0) {
      res.status(400).json({ error: { code: 'NO_AGENTS_AVAILABLE', message: 'No agents available for assignment' } });
      return;
    }
    
    const assignmentResults = [];
    
    for (const ticket of unassignedTickets) {
      // Simple round-robin assignment
      const randomAgent = agents[Math.floor(Math.random() * agents.length)];
      if (!randomAgent) continue;
      
      ticket.assignee = randomAgent._id as any; // Cast to handle ObjectId type
      await ticket.save();
      
      assignmentResults.push({
        ticketId: String(ticket._id),
        assignedTo: {
          id: String(randomAgent._id),
          name: randomAgent.name
        }
      });
      
      // Send notification to assigned agent
      Notifications.broadcastToUser(String(randomAgent._id), 'ticket_assigned', {
        ticketId: String(ticket._id),
        ticketTitle: ticket.title,
        assignedBy: 'Auto-Assignment System'
      });
      
      // Log assignment
      await AuditLogService.log(String(ticket._id), req.traceId || 'n/a', 'system', 'AUTO_ASSIGNED', {
        assigneeId: String(randomAgent._id),
        assigneeName: randomAgent.name,
        initiatedBy: req.user!.sub
      });
    }
    
    res.json({
      message: `Successfully assigned ${assignmentResults.length} tickets`,
      assignedCount: assignmentResults.length,
      assignments: assignmentResults
    });
  } catch (err: any) {
    res.status(400).json({ error: { code: 'AUTO_ASSIGN_FAILED', message: err.message } });
  }
});

// Get workflow statistics (admin/agent)
router.get('/stats/workflow', authenticate, authorize(['admin', 'agent']), async (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Get suggestion statistics
    const [totalSuggestions, autoClosedCount, suggestionsByCategory, recentSuggestions] = await Promise.all([
      AgentSuggestion.countDocuments(),
      AgentSuggestion.countDocuments({ autoClosed: true }),
      AgentSuggestion.aggregate([
        { $group: { _id: '$predictedCategory', count: { $sum: 1 }, avgConfidence: { $avg: '$confidence' } } }
      ]),
      AgentSuggestion.countDocuments({ createdAt: { $gte: last24h } })
    ]);
    
    // Get ticket statistics
    const [unassignedTickets, ticketsLast7d] = await Promise.all([
      Ticket.countDocuments({ assignee: null, status: { $in: ['waiting_human', 'triaged'] } }),
      Ticket.countDocuments({ createdAt: { $gte: last7d } })
    ]);
    
    res.json({
      suggestions: {
        total: totalSuggestions,
        autoClosed: autoClosedCount,
        autoCloseRate: totalSuggestions > 0 ? (autoClosedCount / totalSuggestions * 100).toFixed(1) + '%' : '0%',
        byCategory: suggestionsByCategory,
        recent24h: recentSuggestions
      },
      tickets: {
        unassigned: unassignedTickets,
        created7d: ticketsLast7d
      },
      generatedAt: now.toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'STATS_FETCH_FAILED', message: err.message } });
  }
});

// Manual escalation (admin/agent)
const escalateSchema = z.object({
  ticketId: z.string().min(1),
  reason: z.string().min(1).max(500),
  priority: z.enum(['normal', 'high', 'urgent']).optional()
});
router.post('/escalate', authenticate, authorize(['admin', 'agent']), async (req, res): Promise<void> => {
  try {
    const { ticketId, reason, priority } = escalateSchema.parse(req.body);
    
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } });
      return;
    }
    
    // Update ticket priority and status
    if (priority) {
      (ticket as any).priority = priority; // Cast to handle priority type
    }
    
    if (ticket.status === 'open') {
      ticket.status = 'triaged';
    }
    
    await ticket.save();
    
    // Log manual escalation
    await AuditLogService.log(ticketId, req.traceId || 'n/a', 'agent', 'MANUAL_ESCALATION', {
      escalatedBy: req.user!.sub,
      reason,
      newPriority: (ticket as any).priority,
      newStatus: ticket.status
    });
    
    // Notify relevant parties
    if (ticket.assignee && String(ticket.assignee) !== req.user!.sub) {
      Notifications.broadcastToUser(String(ticket.assignee), 'ticket_escalated', {
        ticketId,
        ticketTitle: ticket.title,
        reason,
        escalatedBy: 'Agent' // Simplified since req.user!.name doesn't exist
      });
    }
    
    res.json({
      message: 'Ticket escalated successfully',
      ticket: {
        id: ticketId,
        priority: (ticket as any).priority,
        status: ticket.status
      }
    });
  } catch (err: any) {
    res.status(400).json({ error: { code: 'ESCALATION_FAILED', message: err.message } });
  }
});

// Run periodic escalation check (admin only)
router.post('/escalation/check', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const result = await EscalationService.runPeriodicEscalationCheck();
    
    res.json({
      message: 'Escalation check completed',
      ...result
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'ESCALATION_CHECK_FAILED', message: err.message } });
  }
});

// Get escalation metrics (admin/agent)
router.get('/stats/escalations', authenticate, authorize(['admin', 'agent']), async (req, res) => {
  try {
    const metrics = await EscalationService.getEscalationMetrics();
    res.json(metrics);
  } catch (err: any) {
    res.status(500).json({ error: { code: 'ESCALATION_METRICS_FAILED', message: err.message } });
  }
});

// Get AI suggestion performance metrics (admin/agent)
const metricsSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});
router.get('/stats/performance', authenticate, authorize(['admin', 'agent']), async (req, res) => {
  try {
    const { startDate, endDate } = metricsSchema.parse(req.query);
    
    const timeframe = startDate && endDate ? {
      start: new Date(startDate),
      end: new Date(endDate)
    } : undefined;
    
    const metrics = await AgentSuggestionService.getPerformanceMetrics(timeframe);
    res.json(metrics);
  } catch (err: any) {
    res.status(500).json({ error: { code: 'PERFORMANCE_METRICS_FAILED', message: err.message } });
  }
});

// Get top performing categories (admin/agent)
router.get('/stats/categories/top', authenticate, authorize(['admin', 'agent']), async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 5;
    const topCategories = await AgentSuggestionService.getTopPerformingCategories(limit);
    res.json(topCategories);
  } catch (err: any) {
    res.status(500).json({ error: { code: 'TOP_CATEGORIES_FAILED', message: err.message } });
  }
});

// Get low performing suggestions for review (admin/agent)
router.get('/suggestions/low-confidence', authenticate, authorize(['admin', 'agent']), async (req, res) => {
  try {
    const threshold = Number(req.query.threshold) || 0.5;
    const lowPerforming = await AgentSuggestionService.getLowPerformingSuggestions(threshold);
    res.json(lowPerforming);
  } catch (err: any) {
    res.status(500).json({ error: { code: 'LOW_CONFIDENCE_SUGGESTIONS_FAILED', message: err.message } });
  }
});

// Provide feedback on suggestion (admin/agent)
const feedbackSchema = z.object({
  ticketId: z.string().min(1),
  feedback: z.string().min(1).max(1000),
  rating: z.enum(['excellent', 'good', 'fair', 'poor']).optional()
});
router.post('/suggestion/feedback', authenticate, authorize(['admin', 'agent']), async (req, res): Promise<void> => {
  try {
    const { ticketId, feedback, rating } = feedbackSchema.parse(req.body);
    
    const suggestion = await AgentSuggestion.findOne({ ticketId });
    if (!suggestion) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Suggestion not found' } });
      return;
    }
    
    await AgentSuggestionService.recordFeedback({
      ticketId,
      agentId: req.user!.sub,
      action: 'accept', // This is feedback, not a direct action
      originalConfidence: suggestion.confidence,
      feedback: `${feedback} (Rating: ${rating || 'not provided'})`
    });
    
    res.json({ message: 'Feedback recorded successfully' });
  } catch (err: any) {
    res.status(400).json({ error: { code: 'FEEDBACK_FAILED', message: err.message } });
  }
});

export default router;


