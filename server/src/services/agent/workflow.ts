import { randomUUID } from 'crypto';
import Article from '../../models/Article.js';
import Ticket from '../../models/Ticket.js';
import AgentSuggestion from '../../models/AgentSuggestion.js';
import User from '../../models/User.js';
import { getEnvConfig } from '../../config/env.js';
import { getLLMProvider } from '../llm/index.js';
import KnowledgeBaseService from '../kb.service.js';
import AuditLogService from '../audit.service.js';
import Notifications from '../notify.service.js';
import { retryWithExponentialBackoff } from '../../utils/retry.js';
import EscalationService from '../escalation.service.js';

export enum WorkflowState {
  PLANNING = 'planning',
  CLASSIFYING = 'classifying',
  RETRIEVING = 'retrieving',
  DRAFTING = 'drafting',
  DECIDING = 'deciding',
  ASSIGNING = 'assigning',
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
  retryCount?: number;
  errorMessage?: string;
  assignedAgentId?: string;
}

export interface AgentAssignmentStrategy {
  findBestAgent(ticketCategory: string, confidence: number): Promise<string | null>;
}

export class WorkflowOrchestrator {
  private readonly MAX_RETRIES = 3;
  private readonly ESCALATION_CONFIDENCE_THRESHOLD = 0.5;

  async triageTicket(ticketId: string): Promise<WorkflowContext> {
    const traceId = randomUUID();
    const ctx: WorkflowContext = { 
      ticketId, 
      traceId, 
      currentState: WorkflowState.PLANNING,
      retryCount: 0 
    };
    
    return this.executeWithRetry(ctx);
  }

  private async executeWithRetry(ctx: WorkflowContext): Promise<WorkflowContext> {
    try {
      return await this.executeWorkflow(ctx);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      ctx.errorMessage = errorMessage;
      
      if (ctx.retryCount! < this.MAX_RETRIES) {
        ctx.retryCount = (ctx.retryCount || 0) + 1;
        await AuditLogService.log(ctx.ticketId, ctx.traceId, 'system', 'TRIAGE_RETRY', {
          attempt: ctx.retryCount,
          error: errorMessage
        });
        
        // Exponential backoff: wait before retry
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, ctx.retryCount!) * 1000));
        
        return this.executeWithRetry(ctx);
      } else {
        ctx.currentState = WorkflowState.FAILED;
        await AuditLogService.log(ctx.ticketId, ctx.traceId, 'system', 'TRIAGE_FAILED', {
          error: errorMessage,
          finalAttempt: ctx.retryCount
        });
        return ctx;
      }
    }
  }

  private async executeWorkflow(ctx: WorkflowContext): Promise<WorkflowContext> {
    const env = getEnvConfig();
    const startTime = Date.now();

    const ticket = await Ticket.findById(ctx.ticketId);
    if (!ticket) throw new Error('Ticket not found');

    await AuditLogService.log(ctx.ticketId, ctx.traceId, 'system', 'TRIAGE_PLANNED', {});
    ctx.currentState = WorkflowState.CLASSIFYING;

    // Classification with error handling
    const provider = getLLMProvider();
    const classifyStart = Date.now();
    
    const classification = await retryWithExponentialBackoff(
      () => provider.classify(`${ticket.title}\n${ticket.description}`),
      { maxRetries: 2, baseDelay: 500 }
    );
    
    ctx.predictedCategory = classification.predictedCategory;
    ctx.confidence = classification.confidence;
    await AuditLogService.log(ctx.ticketId, ctx.traceId, 'system', 'AGENT_CLASSIFIED', classification as any);

    ctx.currentState = WorkflowState.RETRIEVING;
    const scored = await KnowledgeBaseService.getRelevantArticles(
      `${ticket.title}\n${ticket.description}`, 
      5 // Increase article count for better context
    );
    const articleIds = scored.map(s => String(s.article._id));
    ctx.retrievedArticleIds = articleIds;
    await AuditLogService.log(ctx.ticketId, ctx.traceId, 'system', 'KB_RETRIEVED', { 
      articleIds,
      relevanceScores: scored.map(s => s.score)
    });

    ctx.currentState = WorkflowState.DRAFTING;
    const articles = await Article.find({ _id: { $in: articleIds } });
    
    const draft = await retryWithExponentialBackoff(
      () => provider.draft(`${ticket.title}\n${ticket.description}`, articles as any),
      { maxRetries: 2, baseDelay: 500 }
    );
    
    ctx.draftReply = draft.draftReply;
    await AuditLogService.log(ctx.ticketId, ctx.traceId, 'system', 'DRAFT_GENERATED', { 
      citations: draft.citations,
      draftLength: draft.draftReply.length
    });

    ctx.currentState = WorkflowState.DECIDING;
    const latencyMs = Date.now() - startTime;
    ctx.modelLatencyMs = latencyMs;

    // Persist suggestion with enhanced metadata
    const suggestion = await AgentSuggestion.findOneAndUpdate(
      { ticketId: ctx.ticketId },
      {
        ticketId: ctx.ticketId,
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
          retryCount: ctx.retryCount || 0
        }
      },
      { upsert: true, new: true }
    );

    const autoCloseEnabled = env.AUTO_CLOSE_ENABLED;
    const threshold = env.CONFIDENCE_THRESHOLD;

    console.log(`🤖 Auto-close decision for ticket ${ctx.ticketId}:`, {
      autoCloseEnabled,
      threshold,
      confidence: ctx.confidence,
      willAutoClose: autoCloseEnabled && (ctx.confidence ?? 0) >= threshold,
      predictedCategory: ctx.predictedCategory
    });

    if (autoCloseEnabled && (ctx.confidence ?? 0) >= threshold) {
      // Auto resolve with high confidence
      await (ticket as any).addReply(ctx.draftReply || 'Resolved', String(ticket.createdBy), 'system');
      await (ticket as any).resolve();
      suggestion.autoClosed = true;
      await suggestion.save();
      await AuditLogService.log(ctx.ticketId, ctx.traceId, 'system', 'AUTO_CLOSED', { 
        confidence: ctx.confidence,
        threshold
      });
      Notifications.broadcastToUser(String(ticket.createdBy), 'ticket_status', { 
        ticketId: ctx.ticketId, 
        status: 'resolved' 
      });
    } else {
      ctx.currentState = WorkflowState.ASSIGNING;
      
      // Smart agent assignment based on category and confidence
      const assignedAgent = await this.assignToAgent(ctx.predictedCategory || 'other', ctx.confidence || 0);
      
      if (assignedAgent) {
        ticket.assignee = assignedAgent as any; // Cast to handle ObjectId type
        ctx.assignedAgentId = assignedAgent;
        await AuditLogService.log(ctx.ticketId, ctx.traceId, 'system', 'AUTO_ASSIGNED', {
          assigneeId: assignedAgent,
          category: ctx.predictedCategory,
          confidence: ctx.confidence
        });
        Notifications.broadcastToUser(assignedAgent, 'ticket_assigned', { 
          ticketId: ctx.ticketId,
          category: ctx.predictedCategory,
          confidence: ctx.confidence
        });
      }
      
      // Set status based on confidence level
      if ((ctx.confidence || 0) >= this.ESCALATION_CONFIDENCE_THRESHOLD) {
        ticket.status = 'waiting_human';
      } else {
        ticket.status = 'triaged'; // Lower confidence requires more attention
      }
      
      await ticket.save();
      
      await AuditLogService.log(ctx.ticketId, ctx.traceId, 'system', 'ASSIGNED_TO_HUMAN', { 
        confidence: ctx.confidence,
        status: ticket.status,
        assigneeId: ctx.assignedAgentId
      });
    }

    ctx.currentState = WorkflowState.COMPLETED;
    
    // Evaluate for escalation after workflow completion
    try {
      await EscalationService.evaluateTicketForEscalation(ctx.ticketId, ctx.traceId);
    } catch (escalationError) {
      console.error('Escalation evaluation failed:', escalationError);
      // Don't fail the workflow if escalation evaluation fails
    }
    
    return ctx;
  }

  private async assignToAgent(category: string, confidence: number): Promise<string | null> {
    try {
      // Find available agents (admin or agent role)
      const agents = await User.find({
        role: { $in: ['admin', 'agent'] },
        isActive: { $ne: false } // Assuming isActive field exists or defaults to true
      }).select('_id name role');

      if (agents.length === 0) return null;

      // Simple round-robin assignment for now
      // In future, this could be enhanced with workload balancing
      const randomIndex = Math.floor(Math.random() * agents.length);
      const selectedAgent = agents[randomIndex];
      if (!selectedAgent) return null;
      
      return String(selectedAgent._id);
    } catch (error) {
      console.error('Failed to assign agent:', error);
      return null;
    }
  }

  // Batch processing method for handling multiple tickets
  async processTicketsBatch(ticketIds: string[]): Promise<WorkflowContext[]> {
    const results: WorkflowContext[] = [];
    
    // Process in batches to avoid overwhelming the system
    const batchSize = 5;
    
    for (let i = 0; i < ticketIds.length; i += batchSize) {
      const batch = ticketIds.slice(i, i + batchSize);
      const batchPromises = batch.map(ticketId => this.triageTicket(ticketId));
      
      try {
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          const currentTicketId = batch[index];
          if (!currentTicketId) return;
          
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            console.error(`Failed to process ticket ${currentTicketId}:`, result.reason);
            results.push({
              ticketId: currentTicketId,
              traceId: randomUUID(),
              currentState: WorkflowState.FAILED,
              errorMessage: result.reason?.message || 'Unknown error'
            });
          }
        });
      } catch (error) {
        console.error('Batch processing error:', error);
      }
      
      // Brief pause between batches to prevent overwhelming the system
      if (i + batchSize < ticketIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }
}

export default WorkflowOrchestrator;


