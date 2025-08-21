import React, { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import AdminLayout from '../components/AdminLayout';

export const AdminMetrics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  useEffect(() => { (async () => {
    const res = await api.get('/api/admin/metrics');
    setData(res.data);
  })(); }, []);

  if (!data) return <AdminLayout title="System Metrics"><div className="p-2 text-gray-600">Loading...</div></AdminLayout>;

  const cards = useMemo(() => ([
    { title: 'Tickets by Status', content: data.tickets },
    { title: 'Suggestion Performance', content: data.suggestions },
    { title: 'Users by Role', content: data.users }
  ]), [data]);

  return (
    <AdminLayout title="System Metrics">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {cards.map(card => (
          <section key={card.title} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-gray-800">{card.title}</h3>
            <pre className="max-h-72 overflow-auto rounded bg-gray-50 p-3 text-xs text-gray-800">{JSON.stringify(card.content, null, 2)}</pre>
          </section>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminMetrics;



