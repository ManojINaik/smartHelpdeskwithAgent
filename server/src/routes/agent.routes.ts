import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth.js';
import WorkflowOrchestrator from '../services/agent/workflow.js';
import AgentSuggestion from '../models/AgentSuggestion.js';
import AgentSuggestionService from '../services/agentSuggestion.service.js';

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

export default router;


