import React, { useEffect, useState } from 'react';
import api from '../lib/api';

export const AdminMetrics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  useEffect(() => { (async () => {
    const res = await api.get('/api/admin/metrics');
    setData(res.data);
  })(); }, []);

  if (!data) return <div className="p-4 text-gray-600">Loading...</div>;

  return (
    <div className="mx-auto max-w-5xl p-4">
      <h2 className="mb-4 text-xl font-semibold">System Metrics</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded border p-3">
          <h3 className="mb-1 font-medium">Tickets by Status</h3>
          <pre className="overflow-auto text-xs">{JSON.stringify(data.tickets, null, 2)}</pre>
        </div>
        <div className="rounded border p-3">
          <h3 className="mb-1 font-medium">Suggestion Performance</h3>
          <pre className="overflow-auto text-xs">{JSON.stringify(data.suggestions, null, 2)}</pre>
        </div>
        <div className="rounded border p-3">
          <h3 className="mb-1 font-medium">Users by Role</h3>
          <pre className="overflow-auto text-xs">{JSON.stringify(data.users, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
};

export default AdminMetrics;


