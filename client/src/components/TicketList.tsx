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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 justify-between">
        <div className="flex items-center gap-3">
          <label className="form-label">Status</label>
          <select className="form-select" value={status || ''} onChange={e => setStatus(e.target.value as any || undefined)}>
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="triaged">Triaged</option>
            <option value="waiting_human">Waiting Human</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <label className="form-label ml-3">Sort</label>
          <select className="form-select" value={sort} onChange={e => setSort(e.target.value as any)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="status">Status</option>
          </select>
        </div>
        <div className="mt-3 sm:mt-0">
          <span className="muted text-sm">Page {page} / {totalPages}</span>
        </div>
      </div>

      {loading && <div className="muted">Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}

      <ul className="space-y-3">
        {sorted.map(t => (
          <li key={t._id} className="card">
            <div className="flex-between">
              <div>
                <Link to={`/tickets/${t._id}`} className="font-medium text-primary-600 hover:underline">{t.title}</Link>
                <div className="muted text-sm">{new Date(t.createdAt).toLocaleString()}</div>
              </div>
              <div className="ml-4">
                <TicketStatus status={t.status} />
              </div>
            </div>
            <p className="mt-3 muted">{t.description}</p>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-end gap-2">
        <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
        <button className="btn btn-ghost" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
};

export default TicketList;


