import { Router } from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth.js';
import TicketService from '../services/ticket.service.js';
import WorkflowOrchestrator from '../services/agent/workflow.js';
import AuditLogService from '../services/audit.service.js';

const router = Router();

const createSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(5000),
  category: z.enum(['billing', 'tech', 'shipping', 'other']).optional(),
  attachmentUrls: z.array(z.string().url()).max(10).optional(),
});

router.post('/', authenticate, async (req, res) => {
  try {
    const data = createSchema.parse(req.body);
    const createdBy = req.user!.sub;
    const ticket = await TicketService.createTicket({ ...data, createdBy });
    // Trigger triage asynchronously (best-effort)
    const orchestrator = new WorkflowOrchestrator();
    orchestrator.triageTicket(String(ticket._id)).catch(() => {});
    res.status(201).json({ ticket });
  } catch (err: any) {
    res.status(400).json({ error: { code: 'TICKET_CREATE_FAILED', message: err.message } });
  }
});

router.get('/', authenticate, async (req, res) => {
  const status = req.query.status as any;
  const myTickets = String(req.query.my || '').toLowerCase() === 'true';
  const page = Number(req.query.page || 1);
  const pageSize = Number(req.query.pageSize || 20);
  const result = await TicketService.listTickets(req.user!.sub, { status, myTickets }, page, pageSize);
  res.json(result);
});

router.get('/:id', authenticate, async (req, res): Promise<void> => {
  const ticket = await TicketService.getById(req.params.id as string);
  if (!ticket) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } }); return; }
  res.json({ ticket });
});

const replySchema = z.object({ content: z.string().min(1).max(10000) });
router.post('/:id/reply', authenticate, async (req, res): Promise<void> => {
  try {
    const { content } = replySchema.parse(req.body);
    const authorId = req.user!.sub;
    const authorType = req.user!.role === 'user' ? 'user' : 'agent';
    const ticket = await TicketService.addReply(req.params.id as string, content, authorId, authorType);
    if (!ticket) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } }); return; }
    res.json({ ticket });
  } catch (err: any) {
    res.status(400).json({ error: { code: 'TICKET_REPLY_FAILED', message: err.message } });
  }
});

const assignSchema = z.object({ assigneeId: z.string().min(1) });
router.post('/:id/assign', authenticate, authorize(['admin', 'agent']), async (req, res): Promise<void> => {
  try {
    const { assigneeId } = assignSchema.parse(req.body);
    const ticket = await TicketService.assign(req.params.id as string, assigneeId);
    if (!ticket) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } }); return; }
    res.json({ ticket });
  } catch (err: any) {
    res.status(400).json({ error: { code: 'TICKET_ASSIGN_FAILED', message: err.message } });
  }
});

// Update ticket status (admin/agent)
const statusSchema = z.object({ status: z.enum(['open','triaged','waiting_human','resolved','closed']) });
router.put('/:id/status', authenticate, authorize(['admin','agent']), async (req, res): Promise<void> => {
  try {
    const { status } = statusSchema.parse(req.body);
    const ticket = await TicketService.updateStatus(req.params.id as string, status);
    if (!ticket) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Ticket not found' } }); return; }
    await AuditLogService.log(String(ticket._id), req.traceId || 'n/a', 'agent', 'STATUS_CHANGED', { by: req.user!.sub, status });
    res.json({ ticket });
  } catch (err: any) {
    res.status(400).json({ error: { code: 'TICKET_STATUS_UPDATE_FAILED', message: err.message } });
  }
});

export default router;



