import Ticket from '../models/Ticket.js';
import AgentSuggestion from '../models/AgentSuggestion.js';
import User from '../models/User.js';
import AuditLogService from './audit.service.js';
import Notifications from './notify.service.js';
import { getEnvConfig } from '../config/env.js';

export interface EscalationRule {
  name: string;
  condition: (ticket: any, suggestion: any) => boolean;
  action: (ticket: any, suggestion: any, context: EscalationContext) => Promise<void>;
  priority: number; // Higher number = higher priority
}

export interface EscalationContext {
  traceId: string;
  initiatedBy: string;
  reason: string;
  escalatedTo?: string;
}

export class EscalationService {
  private static rules: EscalationRule[] = [
    {
      name: 'LOW_CONFIDENCE_ESCALATION',
      priority: 1,
      condition: (ticket, suggestion) => {
        const env = getEnvConfig();
        return suggestion && suggestion.confidence < env.LOW_CONFIDENCE_THRESHOLD;
      },
      action: async (ticket, suggestion, context) => {
        // Escalate to senior agent or admin
        const admins = await User.find({ 
          role: 'admin',
          isActive: { $ne: false }
        }).select('_id name');
        
        if (admins.length > 0) {
          const admin = admins[0];
          if (admin) {
            ticket.assignee = admin._id as any; // Cast to handle ObjectId type
            ticket.priority = 'high' as any; // Cast to handle priority type
            ticket.status = 'triaged';
            
            context.escalatedTo = String(admin._id);
            context.reason = `Low confidence score: ${(suggestion.confidence * 100).toFixed(1)}%`;
            
            await ticket.save();
            
            // Notify admin about escalation
            Notifications.broadcastToUser(String(admin._id), 'ticket_escalated', {
              ticketId: String(ticket._id),
              ticketTitle: ticket.title,
              reason: context.reason,
              confidence: suggestion.confidence,
              category: suggestion.predictedCategory
            });
          }
        }
      }
    },
    {
      name: 'HIGH_PRIORITY_ESCALATION',
      priority: 2,
      condition: (ticket, suggestion) => {
        const env = getEnvConfig();
        return suggestion && suggestion.confidence < env.HIGH_PRIORITY_THRESHOLD;
      },
      action: async (ticket, suggestion, context) => {
        // Mark as high priority and require immediate attention
        ticket.priority = 'urgent' as any; // Cast to handle priority type
        ticket.status = 'triaged';
        
        context.reason = `Very low confidence score requires immediate attention: ${(suggestion.confidence * 100).toFixed(1)}%`;
        
        await ticket.save();
        
        // Notify all admins
        const admins = await User.find({ 
          role: 'admin',
          isActive: { $ne: false }
        }).select('_id');
        
        for (const admin of admins) {
          Notifications.broadcastToUser(String(admin._id), 'urgent_ticket', {
            ticketId: String(ticket._id),
            ticketTitle: ticket.title,
            reason: context.reason,
            confidence: suggestion.confidence
          });
        }
      }
    },
    {
      name: 'CATEGORY_MISMATCH_ESCALATION',
      priority: 1,
      condition: (ticket, suggestion) => {
        // Check if predicted category conflicts with ticket metadata
        if (!suggestion || !ticket.category) return false;
        return ticket.category !== suggestion.predictedCategory && suggestion.confidence > 0.7;
      },
      action: async (ticket, suggestion, context) => {
        context.reason = `Category mismatch: ticket=${ticket.category}, predicted=${suggestion.predictedCategory}`;
        
        // Flag for manual review
        ticket.status = 'waiting_human';
        await ticket.save();
        
        // Log the mismatch for analysis
        await AuditLogService.log(String(ticket._id), context.traceId, 'system', 'CATEGORY_MISMATCH', {
          ticketCategory: ticket.category,
          predictedCategory: suggestion.predictedCategory,
          confidence: suggestion.confidence
        });
      }
    },
    {
      name: 'SLA_BREACH_ESCALATION',
      priority: 3,
      condition: (ticket, suggestion) => {
        const env = getEnvConfig();
        const slaHours = env.SLA_HOURS;
        const createdTime = new Date(ticket.createdAt).getTime();
        const now = Date.now();
        const hoursSinceCreation = (now - createdTime) / (1000 * 60 * 60);
        
        return hoursSinceCreation > slaHours && ticket.status !== 'resolved' && ticket.status !== 'closed';
      },
      action: async (ticket, suggestion, context) => {
        const env = getEnvConfig();
        const hoursSinceCreation = Math.floor((Date.now() - new Date(ticket.createdAt).getTime()) / (1000 * 60 * 60));
        
        context.reason = `SLA breach: ${hoursSinceCreation}h > ${env.SLA_HOURS}h`;
        
        ticket.priority = 'urgent' as any; // Cast to handle priority type
        if (ticket.status === 'open') {
          ticket.status = 'triaged';
        }
        
        await ticket.save();
        
        // Notify ticket creator and assigned agent
        Notifications.broadcastToUser(String(ticket.createdBy), 'sla_breach', {
          ticketId: String(ticket._id),
          ticketTitle: ticket.title,
          hoursSinceCreation
        });
        
        if (ticket.assignee) {
          Notifications.broadcastToUser(String(ticket.assignee), 'sla_breach', {
            ticketId: String(ticket._id),
            ticketTitle: ticket.title,
            hoursSinceCreation
          });
        }
      }
    }
  ];

  static async evaluateTicketForEscalation(ticketId: string, traceId: string): Promise<EscalationContext[]> {
    const env = getEnvConfig();
    
    if (!env.ESCALATION_ENABLED) {
      return [];
    }

    const ticket = await Ticket.findById(ticketId).populate('createdBy assignee');
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const suggestion = await AgentSuggestion.findOne({ ticketId });
    const escalations: EscalationContext[] = [];

    // Sort rules by priority (highest first)
    const sortedRules = this.rules.sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      if (rule.condition(ticket, suggestion)) {
        const context: EscalationContext = {
          traceId,
          initiatedBy: 'system',
          reason: rule.name
        };

        try {
          await rule.action(ticket, suggestion, context);
          escalations.push(context);

          await AuditLogService.log(ticketId, traceId, 'system', 'ESCALATION_TRIGGERED', {
            rule: rule.name,
            reason: context.reason,
            escalatedTo: context.escalatedTo,
            priority: rule.priority
          });

          // Only apply one escalation rule per evaluation to avoid conflicts
          break;
        } catch (error) {
          console.error(`Escalation rule ${rule.name} failed:`, error);
          await AuditLogService.log(ticketId, traceId, 'system', 'ESCALATION_FAILED', {
            rule: rule.name,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    return escalations;
  }

  static async runPeriodicEscalationCheck(): Promise<{ processed: number; escalated: number }> {
    const env = getEnvConfig();
    
    if (!env.ESCALATION_ENABLED) {
      return { processed: 0, escalated: 0 };
    }

    // Find tickets that might need escalation
    const candidates = await Ticket.find({
      status: { $in: ['open', 'waiting_human', 'triaged'] },
      priority: { $ne: 'urgent' } // Don't re-escalate urgent tickets
    }).limit(100); // Process in batches

    let escalatedCount = 0;

    for (const ticket of candidates) {
      try {
        const escalations = await this.evaluateTicketForEscalation(String(ticket._id), 'periodic-check');
        if (escalations.length > 0) {
          escalatedCount++;
        }
      } catch (error) {
        console.error(`Failed to evaluate ticket ${ticket._id} for escalation:`, error);
      }
    }

    await AuditLogService.log('system', 'periodic-check', 'system', 'ESCALATION_CHECK_COMPLETED', {
      processed: candidates.length,
      escalated: escalatedCount
    });

    return { processed: candidates.length, escalated: escalatedCount };
  }

  static async getEscalationMetrics(): Promise<any> {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [urgentTickets, highPriorityTickets, slaBreachTickets, recentEscalations] = await Promise.all([
      Ticket.countDocuments({ priority: 'urgent', status: { $ne: 'closed' } }),
      Ticket.countDocuments({ priority: 'high', status: { $ne: 'closed' } }),
      Ticket.countDocuments({
        createdAt: { $lte: new Date(now.getTime() - getEnvConfig().SLA_HOURS * 60 * 60 * 1000) },
        status: { $in: ['open', 'waiting_human', 'triaged'] }
      }),
      // Count recent escalation audit logs
      Ticket.aggregate([
        {
          $lookup: {
            from: 'auditlogs',
            localField: '_id',
            foreignField: 'ticketId',
            as: 'escalations'
          }
        },
        {
          $match: {
            'escalations.action': 'ESCALATION_TRIGGERED',
            'escalations.createdAt': { $gte: last24h }
          }
        },
        {
          $count: 'count'
        }
      ])
    ]);

    return {
      urgent: urgentTickets,
      highPriority: highPriorityTickets,
      slaBreaches: slaBreachTickets,
      escalations24h: recentEscalations[0]?.count || 0,
      thresholds: {
        lowConfidence: getEnvConfig().LOW_CONFIDENCE_THRESHOLD,
        highPriority: getEnvConfig().HIGH_PRIORITY_THRESHOLD,
        autoClose: getEnvConfig().CONFIDENCE_THRESHOLD,
        slaHours: getEnvConfig().SLA_HOURS
      }
    };
  }
}

export default EscalationService;