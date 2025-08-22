import Ticket from '../models/Ticket.js';
import { ITicket, AuthorType, TicketStatus } from '../types/models.js';
import { extractTextFromAttachments } from '../utils/attachments.js';

export interface CreateTicketData {
  title: string;
  description: string;
  category?: 'billing' | 'tech' | 'shipping' | 'other';
  attachmentUrls?: string[];
  createdBy: string;
}

export interface TicketFilters {
  status?: TicketStatus;
  myTickets?: boolean;
  assignedToMe?: boolean;
  unassigned?: boolean;
  userRole?: 'admin' | 'agent' | 'user';
}

export class TicketService {
  static async createTicket(data: CreateTicketData): Promise<ITicket> {
    const ticket = await Ticket.create({
      title: data.title,
      description: data.description,
      category: data.category || 'other',
      createdBy: data.createdBy,
      attachmentUrls: data.attachmentUrls || [],
    });

    // Extract text from attachments (txt/md) asynchronously; not blocking response
    if (ticket.attachmentUrls && ticket.attachmentUrls.length > 0) {
      extractTextFromAttachments(ticket.attachmentUrls)
        .then(async (extracted) => {
          try {
            ticket.attachmentExtracts = extracted
              .filter(e => !e.error)
              .map(e => ({ url: e.url, contentType: e.contentType, textSnippet: e.textSnippet, bytes: e.bytes }));
            await ticket.save();
          } catch {
            // ignore background save errors
          }
        })
        .catch(() => {});
    }

    return ticket;
  }

  static async listTickets(userId: string, userRole: string, filters: TicketFilters, page = 1, pageSize = 20) {
    const query: any = {};
    if (filters.status) query.status = filters.status;
    
    // Role-based filtering
    if (userRole === 'admin') {
      // Admins see all tickets unless specifically filtered
      if (filters.myTickets) query.createdBy = userId;
      if (filters.assignedToMe) query.assignee = userId;
      if (filters.unassigned) query.assignee = null;
    } else if (userRole === 'agent') {
      // Agents see assigned tickets and unassigned tickets
      if (filters.myTickets) {
        query.createdBy = userId;
      } else if (filters.assignedToMe) {
        query.assignee = userId;
      } else if (filters.unassigned) {
        query.assignee = null;
      } else {
        // Default: show assigned to me + unassigned
        query.$or = [{ assignee: userId }, { assignee: null }];
      }
    } else {
      // Users see only their own tickets
      query.createdBy = userId;
    }

    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      Ticket.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate('createdBy', 'name email role')
        .populate('assignee', 'name email role'),
      Ticket.countDocuments(query)
    ]);

    return { items, total, page, pageSize };
  }

  static getById(id: string) {
    return Ticket.findById(id).populate('createdBy', 'name email role').populate('assignee', 'name email role');
  }

  static async addReply(id: string, content: string, authorId: string, authorType: AuthorType) {
    const ticket: any = await Ticket.findById(id);
    if (!ticket) return null;
    await (ticket as any).addReply(content, authorId, authorType);
    return ticket;
  }

  static async assign(id: string, assigneeId: string) {
    const ticket: any = await Ticket.findById(id);
    if (!ticket) return null;
    await (ticket as any).assignTo(assigneeId);
    return ticket;
  }

  static async updateStatus(id: string, status: TicketStatus) {
    const ticket: any = await Ticket.findById(id);
    if (!ticket) return null;
    ticket.status = status;
    await ticket.save();
    return ticket;
  }

  static async deleteTicket(id: string): Promise<boolean> {
    try {
      const result = await Ticket.findByIdAndDelete(id);
      return result !== null;
    } catch (error) {
      console.error('Error deleting ticket:', error);
      return false;
    }
  }
}

export default TicketService;


