import { randomUUID } from 'crypto';
import Article from '../../models/Article.js';
import Ticket from '../../models/Ticket.js';
import AgentSuggestion from '../../models/AgentSuggestion.js';
import { getEnvConfig } from '../../config/env.js';
import { getLLMProvider } from '../llm/index.js';
import KnowledgeBaseService from '../kb.service.js';
import AuditLogService from '../audit.service.js';
import Notifications from '../notify.service.js';

export enum WorkflowState {
  PLANNING = 'planning',
  CLASSIFYING = 'classifying',
  RETRIEVING = 'retrieving',
  DRAFTING = 'drafting',
  DECIDING = 'deciding',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface WorkflowContext {
  ticketId: string;
  traceId: string;
  currentState: WorkflowState;
  predictedCategory?: 'billing' | 'tech' | 'shipping' | 'other';
  confidence?: number;
  retrievedArticleIds?: string[];
  draftReply?: string;
  modelLatencyMs?: number;
}

export class WorkflowOrchestrator {
  async triageTicket(ticketId: string): Promise<WorkflowContext> {
    const traceId = randomUUID();
    const ctx: WorkflowContext = { ticketId, traceId, currentState: WorkflowState.PLANNING };
    const env = getEnvConfig();
    const startTime = Date.now();

    try {
      const ticket = await Ticket.findById(ticketId);
      if (!ticket) throw new Error('Ticket not found');

      await AuditLogService.log(ticketId, traceId, 'system', 'TRIAGE_PLANNED', {});
      ctx.currentState = WorkflowState.CLASSIFYING;

      const provider = getLLMProvider();
      const classifyStart = Date.now();
      const classification = await provider.classify(`${ticket.title}\n${ticket.description}`);
      ctx.predictedCategory = classification.predictedCategory;
      ctx.confidence = classification.confidence;
      await AuditLogService.log(ticketId, traceId, 'system', 'AGENT_CLASSIFIED', classification as any);

      ctx.currentState = WorkflowState.RETRIEVING;
      const scored = await KnowledgeBaseService.getRelevantArticles(`${ticket.title}\n${ticket.description}`, 3);
      const articleIds = scored.map(s => String(s.article._id));
      ctx.retrievedArticleIds = articleIds;
      await AuditLogService.log(ticketId, traceId, 'system', 'KB_RETRIEVED', { articleIds });

      ctx.currentState = WorkflowState.DRAFTING;
      const articles = await Article.find({ _id: { $in: articleIds } });
      const draft = await provider.draft(`${ticket.title}\n${ticket.description}`, articles as any);
      ctx.draftReply = draft.draftReply;
      await AuditLogService.log(ticketId, traceId, 'system', 'DRAFT_GENERATED', { citations: draft.citations });

      ctx.currentState = WorkflowState.DECIDING;
      const latencyMs = Date.now() - startTime;
      ctx.modelLatencyMs = latencyMs;

      // Persist suggestion
      const suggestion = await AgentSuggestion.findOneAndUpdate(
        { ticketId },
        {
          ticketId,
          predictedCategory: ctx.predictedCategory,
          articleIds,
          draftReply: ctx.draftReply,
          confidence: ctx.confidence ?? 0.6,
          autoClosed: false,
          modelInfo: {
            provider: env.LLM_PROVIDER,
            model: (provider as any).modelName || (provider.isStubMode() ? 'stub' : 'gemini-2.0-flash'),
            promptVersion: 'v1',
            latencyMs,
          }
        },
        { upsert: true, new: true }
      );

      const autoCloseEnabled = env.AUTO_CLOSE_ENABLED;
      const threshold = env.CONFIDENCE_THRESHOLD;

      if (autoCloseEnabled && (ctx.confidence ?? 0) >= threshold) {
        // auto resolve and reply as system
        await (ticket as any).addReply(ctx.draftReply || 'Resolved', String(ticket.createdBy), 'system');
        await (ticket as any).resolve();
        suggestion.autoClosed = true;
        await suggestion.save();
        await AuditLogService.log(ticketId, traceId, 'system', 'AUTO_CLOSED', { confidence: ctx.confidence });
        Notifications.broadcastToUser(String(ticket.createdBy), 'ticket_status', { ticketId, status: 'resolved' });
      } else {
        // assign to human
        if (ticket.status === 'open') {
          ticket.status = 'waiting_human';
          await ticket.save();
        }
        await AuditLogService.log(ticketId, traceId, 'system', 'ASSIGNED_TO_HUMAN', { confidence: ctx.confidence });
        if (ticket.assignee) {
          Notifications.broadcastToUser(String(ticket.assignee), 'ticket_assigned', { ticketId });
        }
      }

      ctx.currentState = WorkflowState.COMPLETED;
      return ctx;
    } catch (err) {
      ctx.currentState = WorkflowState.FAILED;
      await AuditLogService.log(ctx.ticketId, ctx.traceId, 'system', 'TRIAGE_FAILED', { error: (err as Error).message });
      return ctx;
    }
  }
}

export default WorkflowOrchestrator;


