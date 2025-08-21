import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import TicketStatus from '../components/TicketStatus';
import { Link } from 'react-router-dom';

export const AgentDashboard: React.FC = () => {
  const [assigned, setAssigned] = useState<any[]>([]);
  const [unassigned, setUnassigned] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const a = await api.get('/api/tickets', { params: { pageSize: 50, status: 'waiting_human' } });
        setAssigned(a.data.items);
        const u = await api.get('/api/tickets', { params: { pageSize: 50, status: 'open' } });
        setUnassigned(u.data.items);
      } finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return <div className="p-4 text-gray-600">Loading...</div>;

  return (
    <div className="mx-auto max-w-5xl p-4">
      <h2 className="mb-4 text-xl font-semibold">Agent Dashboard</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <section>
          <h3 className="mb-2 font-medium">Waiting / Assigned</h3>
          <ul className="space-y-2">
            {assigned.map(t => (
              <li key={t._id} className="rounded border p-3">
                <div className="flex items-center justify-between">
                  <Link to={`/tickets/${t._id}`} className="font-medium text-blue-600 hover:underline">{t.title}</Link>
                  <TicketStatus status={t.status} />
                </div>
                <p className="mt-1 text-sm text-gray-700">{t.description}</p>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="mb-2 font-medium">Unassigned</h3>
          <ul className="space-y-2">
            {unassigned.map(t => (
              <li key={t._id} className="rounded border p-3">
                <div className="flex items-center justify-between">
                  <Link to={`/tickets/${t._id}`} className="font-medium text-blue-600 hover:underline">{t.title}</Link>
                  <TicketStatus status={t.status} />
                </div>
                <p className="mt-1 text-sm text-gray-700">{t.description}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default AgentDashboard;


