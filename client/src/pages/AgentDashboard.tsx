import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import TicketStatus from '../components/TicketStatus';
import { Link } from 'react-router-dom';

import AgentNavbar from '../components/AgentNavbar';
import { 
  Clock, 
  UserCheck, 
  CheckCircle, 
  AlertCircle,
  MessageSquare,
  Calendar,
  ArrowRight
} from 'lucide-react';

export const AgentDashboard: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Load all tickets for agent: assigned to me + unassigned
        // Do not pass assignedToMe, server already returns assigned+unassigned by default for agents
        const response = await api.get('/api/tickets', { 
          params: { 
            pageSize: 100
          } 
        });
        setTickets(response.data.items);
      } finally { 
        setLoading(false); 
      }
    }
    load();
  }, []);

  // Group tickets by status
  const waitingAssigned = tickets.filter(t => t.status === 'waiting_human' && t.assignee);
  const unassigned = tickets.filter(t => t.status === 'open' || (t.status === 'waiting_human' && !t.assignee));
  const resolved = tickets.filter(t => t.status === 'resolved' || t.status === 'closed');
  const triaged = tickets.filter(t => t.status === 'triaged');

  if (loading) {
    return (
      <AgentNavbar>
        <div className="flex items-center justify-center p-8">
          <div className="text-gray-600">Loading tickets...</div>
        </div>
      </AgentNavbar>
    );
  }

  const TicketCard: React.FC<{ ticket: any }> = ({ ticket }) => (
    <div className="group rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-card transition-all hover:shadow-lg hover:scale-[1.02] duration-300">
      <div className="flex items-start justify-between mb-3 sm:mb-4 gap-3">
        <div className="flex-1 min-w-0">
          <Link 
            to={`/tickets/${ticket._id}`} 
            className="text-base sm:text-lg font-mulish font-bold text-neutral-900 hover:text-primary-600 transition-colors line-clamp-2 mb-2 block"
          >
            {ticket.title}
          </Link>
          <p className="text-sm font-mulish font-medium text-neutral-600 line-clamp-2 sm:line-clamp-3 leading-relaxed">{ticket.description}</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <TicketStatus status={ticket.status} />
          <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all duration-300" />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 sm:pt-4 border-t border-neutral-100 gap-2 sm:gap-0">
        <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-mulish font-medium text-neutral-500">
          <div className="flex items-center gap-1 sm:gap-2">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>{ticket.replies?.length || 0} replies</span>
          </div>
        </div>
      </div>
    </div>
  );

  const SectionHeader: React.FC<{ 
    title: string; 
    count: number; 
    icon: React.ReactNode; 
    color: string;
    description: string;
  }> = ({ title, count, icon, color, description }) => (
    <div className="mb-4 sm:mb-6">
      <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
        <div className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl ${color} shadow-sm flex-shrink-0`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl font-mulish font-bold text-neutral-900 truncate">{title}</h3>
          <p className="text-xs sm:text-sm font-mulish font-medium text-neutral-500 line-clamp-1 sm:line-clamp-none">{description}</p>
        </div>
        <div className="ml-auto rounded-2xl bg-neutral-100 px-3 py-1 sm:px-4 sm:py-2 shadow-sm flex-shrink-0">
          <span className="text-base sm:text-lg font-mulish font-bold text-neutral-700">{count}</span>
        </div>
      </div>
    </div>
  );

  return (
    <AgentNavbar>
      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-mulish font-bold text-neutral-900 mb-2 sm:mb-3">Agent Dashboard</h1>
          <p className="text-base sm:text-lg font-mulish font-medium text-neutral-600">Manage and respond to support tickets</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:gap-10 md:grid-cols-2 xl:grid-cols-4">
          {/* Waiting / Assigned */}
          <section className="space-y-6">
            <SectionHeader
              title="Waiting / Assigned"
              count={waitingAssigned.length}
              icon={<Clock className="h-5 w-5 text-orange-600" />}
              color="bg-orange-100"
              description="Tickets assigned to you"
            />
            <div className="space-y-3 sm:space-y-4">
              {waitingAssigned.map(ticket => (
                <TicketCard key={ticket._id} ticket={ticket} />
              ))}
              {waitingAssigned.length === 0 && (
                <div className="rounded-2xl border-2 border-dashed border-neutral-200 p-6 sm:p-8 text-center bg-neutral-50">
                  <Clock className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-neutral-400 mb-3" />
                  <p className="text-sm sm:text-base font-mulish font-semibold text-neutral-500">No tickets waiting</p>
                  <p className="text-xs sm:text-sm font-mulish font-medium text-neutral-400 mt-1">New assignments will appear here</p>
                </div>
              )}
            </div>
          </section>

          {/* Unassigned */}
          <section className="space-y-6">
            <SectionHeader
              title="Unassigned"
              count={unassigned.length}
              icon={<AlertCircle className="h-5 w-5 text-red-600" />}
              color="bg-red-100"
              description="Tickets needing assignment"
            />
            <div className="space-y-4">
              {unassigned.map(ticket => (
                <TicketCard key={ticket._id} ticket={ticket} />
              ))}
              {unassigned.length === 0 && (
                <div className="rounded-2xl border-2 border-dashed border-neutral-200 p-8 text-center bg-neutral-50">
                  <AlertCircle className="mx-auto h-12 w-12 text-neutral-400 mb-3" />
                  <p className="text-base font-mulish font-semibold text-neutral-500">No unassigned tickets</p>
                  <p className="text-sm font-mulish font-medium text-neutral-400 mt-1">All tickets have been assigned</p>
                </div>
              )}
            </div>
          </section>

          {/* Triaged */}
          <section className="space-y-6">
            <SectionHeader
              title="Triaged"
              count={triaged.length}
              icon={<UserCheck className="h-5 w-5 text-blue-600" />}
              color="bg-blue-100"
              description="AI processed tickets"
            />
            <div className="space-y-4">
              {triaged.map(ticket => (
                <TicketCard key={ticket._id} ticket={ticket} />
              ))}
              {triaged.length === 0 && (
                <div className="rounded-2xl border-2 border-dashed border-neutral-200 p-8 text-center bg-neutral-50">
                  <UserCheck className="mx-auto h-12 w-12 text-neutral-400 mb-3" />
                  <p className="text-base font-mulish font-semibold text-neutral-500">No triaged tickets</p>
                  <p className="text-sm font-mulish font-medium text-neutral-400 mt-1">AI-processed tickets will appear here</p>
                </div>
              )}
            </div>
          </section>

          {/* Resolved */}
          <section className="space-y-6">
            <SectionHeader
              title="Resolved"
              count={resolved.length}
              icon={<CheckCircle className="h-5 w-5 text-green-600" />}
              color="bg-green-100"
              description="Completed tickets"
            />
            <div className="space-y-4">
              {resolved.map(ticket => (
                <TicketCard key={ticket._id} ticket={ticket} />
              ))}
              {resolved.length === 0 && (
                <div className="rounded-2xl border-2 border-dashed border-neutral-200 p-8 text-center bg-neutral-50">
                  <CheckCircle className="mx-auto h-12 w-12 text-neutral-400 mb-3" />
                  <p className="text-base font-mulish font-semibold text-neutral-500">No resolved tickets</p>
                  <p className="text-sm font-mulish font-medium text-neutral-400 mt-1">Completed tickets will appear here</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </AgentNavbar>
  );
};

export default AgentDashboard;



