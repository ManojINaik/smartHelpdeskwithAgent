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
    <div className="group rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Link 
            to={`/tickets/${ticket._id}`} 
            className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
          >
            {ticket.title}
          </Link>
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">{ticket.description}</p>
          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(ticket.createdAt).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {ticket.replies?.length || 0} replies
            </div>
          </div>
        </div>
        <div className="ml-4 flex items-center gap-2">
          <TicketStatus status={ticket.status} />
          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
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
    <div className="mb-4">
      <div className="flex items-center gap-3 mb-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <div className="ml-auto rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
          {count}
        </div>
      </div>
    </div>
  );

  return (
    <AgentNavbar>
      <main className="mx-auto max-w-7xl p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Agent Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage and respond to support tickets</p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-4">
          {/* Waiting / Assigned */}
          <section className="space-y-4">
            <SectionHeader
              title="Waiting / Assigned"
              count={waitingAssigned.length}
              icon={<Clock className="h-4 w-4 text-orange-600" />}
              color="bg-orange-100"
              description="Tickets assigned to you"
            />
            <div className="space-y-3">
              {waitingAssigned.map(ticket => (
                <TicketCard key={ticket._id} ticket={ticket} />
              ))}
              {waitingAssigned.length === 0 && (
                <div className="rounded-lg border-2 border-dashed border-gray-200 p-6 text-center">
                  <Clock className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">No tickets waiting</p>
                </div>
              )}
            </div>
          </section>

          {/* Unassigned */}
          <section className="space-y-4">
            <SectionHeader
              title="Unassigned"
              count={unassigned.length}
              icon={<AlertCircle className="h-4 w-4 text-red-600" />}
              color="bg-red-100"
              description="Tickets needing assignment"
            />
            <div className="space-y-3">
              {unassigned.map(ticket => (
                <TicketCard key={ticket._id} ticket={ticket} />
              ))}
              {unassigned.length === 0 && (
                <div className="rounded-lg border-2 border-dashed border-gray-200 p-6 text-center">
                  <AlertCircle className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">No unassigned tickets</p>
                </div>
              )}
            </div>
          </section>

          {/* Triaged */}
          <section className="space-y-4">
            <SectionHeader
              title="Triaged"
              count={triaged.length}
              icon={<UserCheck className="h-4 w-4 text-blue-600" />}
              color="bg-blue-100"
              description="AI processed tickets"
            />
            <div className="space-y-3">
              {triaged.map(ticket => (
                <TicketCard key={ticket._id} ticket={ticket} />
              ))}
              {triaged.length === 0 && (
                <div className="rounded-lg border-2 border-dashed border-gray-200 p-6 text-center">
                  <UserCheck className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">No triaged tickets</p>
                </div>
              )}
            </div>
          </section>

          {/* Resolved */}
          <section className="space-y-4">
            <SectionHeader
              title="Resolved"
              count={resolved.length}
              icon={<CheckCircle className="h-4 w-4 text-green-600" />}
              color="bg-green-100"
              description="Completed tickets"
            />
            <div className="space-y-3">
              {resolved.map(ticket => (
                <TicketCard key={ticket._id} ticket={ticket} />
              ))}
              {resolved.length === 0 && (
                <div className="rounded-lg border-2 border-dashed border-gray-200 p-6 text-center">
                  <CheckCircle className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">No resolved tickets</p>
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



