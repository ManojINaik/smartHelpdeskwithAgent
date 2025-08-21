import { create } from 'zustand';
import api from '../lib/api';

export type TicketStatus = 'open' | 'triaged' | 'waiting_human' | 'resolved' | 'closed';
export type TicketCategory = 'billing' | 'tech' | 'shipping' | 'other';

export interface TicketReply {
  _id?: string;
  content: string;
  author: string;
  authorType: 'user' | 'agent' | 'system';
  createdAt: string;
}

export interface TicketItem {
  _id: string;
  title: string;
  description: string;
  category: TicketCategory;
  status: TicketStatus;
  assignee?: string | null;
  createdAt: string;
  updatedAt: string;
  replies: TicketReply[];
  isOptimistic?: boolean;
}

interface TicketsState {
  items: TicketItem[];
  total: number;
  loading: boolean;
  error: string | null;
  fetchTickets: (params?: { status?: TicketStatus; my?: boolean; page?: number; pageSize?: number; assignedToMe?: boolean; unassigned?: boolean }) => Promise<void>;
  createTicket: (payload: { title: string; description: string; category?: TicketCategory; attachmentUrls?: string[] }) => Promise<TicketItem>;
  addReply: (ticketId: string, content: string) => Promise<void>;
  assignTicket: (ticketId: string, assigneeId: string) => Promise<void>;
}

export const useTicketsStore = create<TicketsState>((set, get) => ({
  items: [],
  total: 0,
  loading: false,
  error: null,

  async fetchTickets(params) {
    // Prevent multiple simultaneous requests
    if (get().loading) {
      return;
    }
    
    set({ loading: true, error: null });
    try {
      const apiParams: any = { 
        page: params?.page ?? 1, 
        pageSize: params?.pageSize ?? 10,
        status: params?.status
      };
      
      if (params?.my) apiParams.my = true;
      if (params?.assignedToMe) apiParams.assignedToMe = true;
      if (params?.unassigned) apiParams.unassigned = true;
      
      console.log('Fetching tickets with params:', apiParams);
      const res = await api.get('/api/tickets', { params: apiParams });
      console.log('Tickets fetched:', res.data);
      set({ items: res.data.items, total: res.data.total, loading: false, error: null });
    } catch (e: any) {
      console.error('Failed to fetch tickets:', e);
      let errorMessage = 'Failed to load tickets';
      
      if (e?.response?.data?.error?.message) {
        errorMessage = e.response.data.error.message;
      } else if (e?.message) {
        errorMessage = e.message;
      } else if (e?.code === 'ERR_NETWORK') {
        errorMessage = 'Network error - please check your connection';
      } else if (e?.code === 'ERR_INSUFFICIENT_RESOURCES') {
        errorMessage = 'Server is temporarily unavailable - please try again later';
      }
      
      set({ loading: false, error: errorMessage });
    }
  },

  async createTicket(payload) {
    const tempId = `temp-${Date.now()}`;
    const optimistic: TicketItem = {
      _id: tempId,
      title: payload.title,
      description: payload.description,
      category: payload.category || 'other',
      status: 'open',
      assignee: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      replies: [],
      isOptimistic: true,
    };
    set({ items: [optimistic, ...get().items] });
    try {
      console.log('Creating ticket with payload:', payload);
      const res = await api.post('/api/tickets', payload);
      console.log('Ticket created successfully:', res.data);
      const real = res.data.ticket as TicketItem;
      set({
        items: get().items.map(it => (it._id === tempId ? real : it))
      });
      return real;
    } catch (e: any) {
      console.error('Failed to create ticket:', e);
      // rollback
      set({
        items: get().items.filter(it => it._id !== tempId),
        error: e?.response?.data?.error?.message || 'Failed to create ticket',
      });
      throw e;
    }
  },

  async addReply(ticketId, content) {
    const prev = get().items;
    // Optimistic append
    set({
      items: prev.map(t => t._id === ticketId ? {
        ...t,
        replies: [...t.replies, { content, author: 'me', authorType: 'user', createdAt: new Date().toISOString() }]
      } : t)
    });
    try {
      await api.post(`/api/tickets/${ticketId}/reply`, { content });
      // Optionally refetch specific ticket later
    } catch (e: any) {
      // rollback
      set({ items: prev, error: e?.response?.data?.error?.message || 'Failed to add reply' });
    }
  },

  async assignTicket(ticketId, assigneeId) {
    const prev = get().items;
    // Optimistic
    set({ items: prev.map(t => t._id === ticketId ? { ...t, assignee: assigneeId, status: t.status === 'open' ? 'waiting_human' : t.status } : t) });
    try {
      await api.post(`/api/tickets/${ticketId}/assign`, { assigneeId });
    } catch (e: any) {
      set({ items: prev, error: e?.response?.data?.error?.message || 'Failed to assign ticket' });
    }
  },
}));

export default useTicketsStore;


