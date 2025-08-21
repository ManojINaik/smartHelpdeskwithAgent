import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';
import TicketStatus from '../components/TicketStatus';

export const TicketDetail: React.FC = () => {
  const { id } = useParams();
  const [ticket, setTicket] = useState<any>(null);
  const [audit, setAudit] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const t = await api.get(`/api/tickets/${id}`);
        setTicket(t.data.ticket);
        const a = await api.get(`/api/audit/tickets/${id}`);
        setAudit(a.data.logs);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  const sendReply = async () => {
    if (!reply.trim()) return;
    await api.post(`/api/tickets/${id}/reply`, { content: reply });
    setReply('');
    const t = await api.get(`/api/tickets/${id}`);
    setTicket(t.data.ticket);
  };

  if (loading) return <div className="p-4 text-gray-600">Loading...</div>;
  if (!ticket) return <div className="p-4 text-red-600">Not found</div>;

  return (
    <div className="mx-auto max-w-4xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{ticket.title}</h2>
          <div className="text-sm text-gray-600">Created {new Date(ticket.createdAt).toLocaleString()}</div>
        </div>
        <TicketStatus status={ticket.status} />
      </div>

      <p className="mb-6 text-gray-800">{ticket.description}</p>

      <div className="mb-6">
        <h3 className="mb-2 font-medium">Conversation</h3>
        <ul className="space-y-2">
          {ticket.replies?.map((r: any) => (
            <li key={r._id} className="rounded border p-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{r.authorType}</span>
                <span className="text-gray-600">{new Date(r.createdAt).toLocaleString()}</span>
              </div>
              <p className="mt-1">{r.content}</p>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex gap-2">
          <input className="flex-1 rounded border px-3 py-2" placeholder="Reply..." value={reply} onChange={e => setReply(e.target.value)} />
          <button className="rounded bg-blue-600 px-3 py-2 text-white" onClick={sendReply}>Send</button>
        </div>
      </div>

      <div>
        <h3 className="mb-2 font-medium">Audit Timeline</h3>
        <ul className="space-y-1 text-sm">
          {audit.map((l) => (
            <li key={l._id} className="rounded border p-2">
              <div className="flex items-center justify-between">
                <span>{l.action}</span>
                <span className="text-gray-600">{new Date(l.timestamp).toLocaleString()}</span>
              </div>
              {l.meta && Object.keys(l.meta).length > 0 && (
                <pre className="mt-1 overflow-auto rounded bg-gray-50 p-2 text-xs">{JSON.stringify(l.meta, null, 2)}</pre>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TicketDetail;


