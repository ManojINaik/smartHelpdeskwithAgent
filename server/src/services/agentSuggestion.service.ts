import AgentSuggestion from '../models/AgentSuggestion.js';
import Ticket from '../models/Ticket.js';
import AuditLogService from './audit.service.js';
import Notifications from './notify.service.js';

export interface SuggestionMetrics {
  totalSuggestions: number;
  autoClosedCount: number;
  acceptedCount: number;
  rejectedCount: number;
  autoCloseRate: number;
  acceptanceRate: number;
  averageConfidence: number;
  categoryBreakdown: Array<{
    category: string;
    count: number;
    avgConfidence: number;
    autoCloseRate: number;
  }>;
  performanceRating: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
}

export interface SuggestionFeedback {
  ticketId: string;
  agentId: string;
  action: 'accept' | 'reject' | 'modify';
  originalConfidence: number;
  feedback?: string;
  modificationsMade?: string[];
}

export class AgentSuggestionService {
  static async getByTicketId(ticketId: string) {
    return AgentSuggestion.findOne({ ticketId });
  }

  static async listSuggestions(params: { 
    autoClosed?: boolean; 
    minConfidence?: number; 
    maxConfidence?: number;
    category?: string;
    limit?: number;
    offset?: number;
  }) {
    const filter: any = {};
    if (typeof params.autoClosed === 'boolean') filter.autoClosed = params.autoClosed;
    if (typeof params.minConfidence === 'number' || typeof params.maxConfidence === 'number') {
      filter.confidence = {} as any;
      if (params.minConfidence != null) filter.confidence.$gte = params.minConfidence;
      if (params.maxConfidence != null) filter.confidence.$lte = params.maxConfidence;
    }
    if (params.category) filter.predictedCategory = params.category;
    
    const query = AgentSuggestion.find(filter).sort({ createdAt: -1 });
    if (params.limit) query.limit(params.limit);
    if (params.offset) query.skip(params.offset);
    
    return query;
  }

  static async acceptSuggestion(ticketId: string, agentId: string, editedReply?: string, traceId?: string) {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return null;
    const suggestion = await AgentSuggestion.findOne({ ticketId });
    if (!suggestion) return null;

    const replyContent = editedReply && editedReply.trim().length > 0 ? editedReply : suggestion.draftReply;
    const wasModified = editedReply && editedReply.trim() !== suggestion.draftReply;

    await (ticket as any).addReply(replyContent, agentId, 'agent');
    await (ticket as any).resolve();

    // Track acceptance and modifications
    await this.recordFeedback({
      ticketId,
      agentId,
      action: wasModified ? 'modify' : 'accept',
      originalConfidence: suggestion.confidence,
      modificationsMade: wasModified ? ['reply_modified'] : undefined
    });

    await AuditLogService.log(ticketId, traceId || 'n/a', 'agent', 'REPLY_SENT', { 
      by: agentId,
      wasModified,
      originalConfidence: suggestion.confidence
    });
    await AuditLogService.log(ticketId, traceId || 'n/a', 'agent', 'TICKET_RESOLVED', {});

    // Notify ticket creator
    Notifications.broadcastToUser(String(ticket.createdBy), 'ticket_resolved', {
      ticketId,
      resolvedBy: agentId
    });

    return { ticket, suggestion };
  }

  static async rejectSuggestion(ticketId: string, agentId: string, traceId?: string, feedback?: string) {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return null;
    const suggestion = await AgentSuggestion.findOne({ ticketId });
    if (!suggestion) return null;

    // Keep ticket waiting for human, ensure status reflects that
    if (ticket.status === 'open' || ticket.status === 'triaged') {
      ticket.status = 'waiting_human';
      await ticket.save();
    }

    // Track rejection
    await this.recordFeedback({
      ticketId,
      agentId,
      action: 'reject',
      originalConfidence: suggestion.confidence,
      feedback
    });

    await AuditLogService.log(ticketId, traceId || 'n/a', 'agent', 'SUGGESTION_REJECTED', { 
      by: agentId,
      confidence: suggestion.confidence,
      feedback
    });
    
    return { ticket, suggestion };
  }

  static async recordFeedback(feedback: SuggestionFeedback): Promise<void> {
    await AuditLogService.log(feedback.ticketId, 'n/a', 'agent', 'SUGGESTION_FEEDBACK', {
      agentId: feedback.agentId,
      action: feedback.action,
      originalConfidence: feedback.originalConfidence,
      feedback: feedback.feedback,
      modificationsMade: feedback.modificationsMade
    });
  }

  static async getPerformanceMetrics(timeframe?: { start: Date; end: Date }): Promise<SuggestionMetrics> {
    const filter: any = {};
    if (timeframe) {
      filter.createdAt = { $gte: timeframe.start, $lte: timeframe.end };
    }

    const [totalSuggestions, autoClosedCount, categoryStats, feedbackStats] = await Promise.all([
      AgentSuggestion.countDocuments(filter),
      AgentSuggestion.countDocuments({ ...filter, autoClosed: true }),
      AgentSuggestion.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$predictedCategory',
            count: { $sum: 1 },
            avgConfidence: { $avg: '$confidence' },
            autoClosedCount: {
              $sum: {
                $cond: [{ $eq: ['$autoClosed', true] }, 1, 0]
              }
            }
          }
        }
      ]),
      this.getFeedbackStats(timeframe)
    ]);

    const avgConfidenceResult = await AgentSuggestion.aggregate([
      { $match: filter },
      { $group: { _id: null, avgConfidence: { $avg: '$confidence' } } }
    ]);

    const averageConfidence = avgConfidenceResult[0]?.avgConfidence || 0;
    const autoCloseRate = totalSuggestions > 0 ? (autoClosedCount / totalSuggestions) * 100 : 0;
    const acceptanceRate = totalSuggestions > 0 ? (feedbackStats.acceptedCount / totalSuggestions) * 100 : 0;

    const categoryBreakdown = categoryStats.map((cat: any) => ({
      category: cat._id || 'unknown',
      count: cat.count,
      avgConfidence: cat.avgConfidence,
      autoCloseRate: cat.count > 0 ? (cat.autoClosedCount / cat.count) * 100 : 0
    }));

    const performanceRating = await this.calculatePerformanceRating(filter);

    return {
      totalSuggestions,
      autoClosedCount,
      acceptedCount: feedbackStats.acceptedCount,
      rejectedCount: feedbackStats.rejectedCount,
      autoCloseRate,
      acceptanceRate,
      averageConfidence,
      categoryBreakdown,
      performanceRating
    };
  }

  private static async getFeedbackStats(timeframe?: { start: Date; end: Date }) {
    // Count feedback from audit logs
    const pipeline: any[] = [
      {
        $match: {
          action: 'SUGGESTION_FEEDBACK',
          ...(timeframe && {
            createdAt: { $gte: timeframe.start, $lte: timeframe.end }
          })
        }
      },
      {
        $group: {
          _id: '$details.action',
          count: { $sum: 1 }
        }
      }
    ];

    // This would need the AuditLog model, but for now we'll use a simplified approach
    // In a real implementation, you'd query the audit logs
    return {
      acceptedCount: 0, // TODO: Implement based on audit logs
      rejectedCount: 0, // TODO: Implement based on audit logs
      modifiedCount: 0  // TODO: Implement based on audit logs
    };
  }

  private static async calculatePerformanceRating(filter: any) {
    const confidenceRanges = await AgentSuggestion.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $gte: ['$confidence', 0.9] }, then: 'excellent' },
                { case: { $gte: ['$confidence', 0.75] }, then: 'good' },
                { case: { $gte: ['$confidence', 0.6] }, then: 'fair' }
              ],
              default: 'poor'
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const rating = { excellent: 0, good: 0, fair: 0, poor: 0 };
    confidenceRanges.forEach((range: any) => {
      rating[range._id as keyof typeof rating] = range.count;
    });

    return rating;
  }

  static async getTopPerformingCategories(limit: number = 5): Promise<Array<{
    category: string;
    successRate: number;
    avgConfidence: number;
    totalSuggestions: number;
  }>> {
    const results = await AgentSuggestion.aggregate([
      {
        $group: {
          _id: '$predictedCategory',
          totalSuggestions: { $sum: 1 },
          autoClosedCount: {
            $sum: {
              $cond: [{ $eq: ['$autoClosed', true] }, 1, 0]
            }
          },
          avgConfidence: { $avg: '$confidence' }
        }
      },
      {
        $addFields: {
          successRate: {
            $multiply: [
              { $divide: ['$autoClosedCount', '$totalSuggestions'] },
              100
            ]
          }
        }
      },
      { $sort: { successRate: -1, avgConfidence: -1 } },
      { $limit: limit }
    ]);

    return results.map((result: any) => ({
      category: result._id || 'unknown',
      successRate: result.successRate,
      avgConfidence: result.avgConfidence,
      totalSuggestions: result.totalSuggestions
    }));
  }

  static async getLowPerformingSuggestions(confidenceThreshold: number = 0.5): Promise<any[]> {
    return AgentSuggestion.find({
      confidence: { $lt: confidenceThreshold },
      autoClosed: false
    })
    .populate('ticketId')
    .sort({ confidence: 1 })
    .limit(20);
  }
}

export default AgentSuggestionService;


