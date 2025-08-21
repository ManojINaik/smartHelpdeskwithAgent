import React, { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import AdminLayout from '../components/AdminLayout';
import { 
  Users, 
  MessageSquare, 
  TrendingUp,
  CheckCircle
} from 'lucide-react';

export const AdminMetrics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    (async () => {
      try {
        const res = await api.get('/api/admin/metrics');
        setData(res.data);
      } catch (error) {
        console.error('Failed to load metrics:', error);
      } finally {
        setLoading(false);
      }
    })(); 
  }, []);

  const cards = useMemo(() => {
    if (!data) return [];
    return [
      { title: 'Tickets by Status', content: data.tickets, icon: <MessageSquare className="h-5 w-5" /> },
      { title: 'Suggestion Performance', content: data.suggestions, icon: <TrendingUp className="h-5 w-5" /> },
      { title: 'Users by Role', content: data.users, icon: <Users className="h-5 w-5" /> }
    ];
  }, [data]);

  if (loading) {
    return (
      <AdminLayout title="System Metrics">
        <div className="flex items-center justify-center p-8">
          <div className="text-gray-600">Loading metrics...</div>
        </div>
      </AdminLayout>
    );
  }

  const MetricCard: React.FC<{ card: any }> = ({ card }) => (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
          {card.icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{card.title}</h3>
      </div>
      <div className="rounded-lg bg-gray-50 p-4">
        <pre className="max-h-96 overflow-auto text-sm text-gray-800">
          {JSON.stringify(card.content, null, 2)}
        </pre>
      </div>
    </div>
  );

  const QuickStats: React.FC = () => {
    if (!data) return null;
    
    const totalTickets = data.tickets?.reduce((sum: number, t: any) => sum + t.count, 0) || 0;
    const totalUsers = data.users?.reduce((sum: number, u: any) => sum + u.count, 0) || 0;
    const avgConfidence = data.suggestions?.[0]?.avgConfidence || 0;
    const autoCloseRate = data.suggestions?.[0]?.autoCloseRate || 0;

    return (
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{totalTickets}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Confidence</p>
              <p className="text-2xl font-bold text-gray-900">{(avgConfidence * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Auto-Close Rate</p>
              <p className="text-2xl font-bold text-gray-900">{(autoCloseRate * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout title="System Metrics">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Metrics</h1>
          <p className="mt-2 text-gray-600">Overview of system performance and usage statistics</p>
        </div>

        <QuickStats />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {cards.map(card => (
            <MetricCard key={card.title} card={card} />
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminMetrics;



