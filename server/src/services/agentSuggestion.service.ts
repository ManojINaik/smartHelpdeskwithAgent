import AgentSuggestion from '../models/AgentSuggestion.js';
import Ticket from '../models/Ticket.js';
import AuditLogService from './audit.service.js';

export class AgentSuggestionService {
  static async getByTicketId(ticketId: string) {
    return AgentSuggestion.findOne({ ticketId });
  }

  static async listSuggestions(params: { autoClosed?: boolean; minConfidence?: number; maxConfidence?: number }) {
    const filter: any = {};
    if (typeof params.autoClosed === 'boolean') filter.autoClosed = params.autoClosed;
    if (typeof params.minConfidence === 'number' || typeof params.maxConfidence === 'number') {
      filter.confidence = {} as any;
      if (params.minConfidence != null) filter.confidence.$gte = params.minConfidence;
      if (params.maxConfidence != null) filter.confidence.$lte = params.maxConfidence;
    }
    return AgentSuggestion.find(filter).sort({ createdAt: -1 });
  }

  static async acceptSuggestion(ticketId: string, agentId: string, editedReply?: string, traceId?: string) {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return null;
    const suggestion = await AgentSuggestion.findOne({ ticketId });
    if (!suggestion) return null;

    const replyContent = editedReply && editedReply.trim().length > 0 ? editedReply : suggestion.draftReply;

    await (ticket as any).addReply(replyContent, agentId, 'agent');
    await (ticket as any).resolve();

    await AuditLogService.log(ticketId, traceId || 'n/a', 'agent', 'REPLY_SENT', { by: agentId });
    await AuditLogService.log(ticketId, traceId || 'n/a', 'agent', 'TICKET_RESOLVED', {});

    return { ticket, suggestion };
  }

  static async rejectSuggestion(ticketId: string, agentId: string, traceId?: string) {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return null;
    const suggestion = await AgentSuggestion.findOne({ ticketId });
    if (!suggestion) return null;

    // Keep ticket waiting for human, ensure status reflects that
    if (ticket.status === 'open' || ticket.status === 'triaged') {
      ticket.status = 'waiting_human';
      await ticket.save();
    }

    await AuditLogService.log(ticketId, traceId || 'n/a', 'agent', 'SUGGESTION_REJECTED', { by: agentId });
    return { ticket, suggestion };
  }
}

export default AgentSuggestionService;


