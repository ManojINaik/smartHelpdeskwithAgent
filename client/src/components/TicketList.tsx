import React, { useMemo, useState } from 'react';
import TicketStatus from './TicketStatus';
import { useTickets } from '../hooks/useTickets';
import { Link } from 'react-router-dom';

export const TicketList: React.FC = () => {
  const { items, loading, error, page, setPage, total, status, setStatus } = useTickets();
  const [sort, setSort] = useState<'newest' | 'oldest' | 'status'>('newest');
  const totalPages = Math.max(1, Math.ceil(total / 10));
  const sorted = useMemo(() => {
    const c = [...items];
    if (sort === 'newest') return c.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    if (sort === 'oldest') return c.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
    return c.sort((a, b) => a.status.localeCompare(b.status));
  }, [items, sort]);
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <label className="text-sm text-gray-700">Status:</label>
        <select className="rounded border px-2 py-1" value={status || ''} onChange={e => setStatus(e.target.value as any || undefined)}>
          <option value="">All</option>
          <option value="open">Open</option>
          <option value="triaged">Triaged</option>
          <option value="waiting_human">Waiting Human</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <label className="ml-4 text-sm text-gray-700">Sort:</label>
        <select className="rounded border px-2 py-1" value={sort} onChange={e => setSort(e.target.value as any)}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="status">Status</option>
        </select>
      </div>
      {loading && <div className="text-gray-600">Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      <ul className="space-y-2">
        {sorted.map(t => (
          <li key={t._id} className="rounded border p-3">
            <div className="flex items-center justify-between">
              <div>
                <Link to={`/tickets/${t._id}`} className="font-medium text-blue-600 hover:underline">{t.title}</Link>
                <div className="text-sm text-gray-600">{new Date(t.createdAt).toLocaleString()}</div>
              </div>
              <TicketStatus status={t.status} />
            </div>
            <p className="mt-2 text-gray-700">{t.description}</p>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between">
        <button className="rounded bg-gray-200 px-3 py-1" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
        <span className="text-sm text-gray-700">Page {page} / {totalPages}</span>
        <button className="rounded bg-gray-200 px-3 py-1" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
};

export default TicketList;


