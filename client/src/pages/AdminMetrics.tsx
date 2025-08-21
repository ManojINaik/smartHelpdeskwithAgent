import React, { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import AdminLayout from '../components/AdminLayout';
import { ModernCard } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  Users, 
  MessageSquare, 
  TrendingUp,
  CheckCircle,
  Clock,
  Shield,
  UserCheck,
  AlertCircle,
  Activity,
  Target,
  Zap
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

  const MetricCard: React.FC<{ card: any }> = ({ card }) => {
    const renderTicketsByStatus = (tickets: any[]) => (
      <div className="space-y-3">
        {tickets.map((ticket, index) => {
          const getStatusConfig = (status: string) => {
            switch (status) {
              case 'open': return { bg: 'bg-primary-100', text: 'text-primary-700', icon: Clock };
              case 'triaged': return { bg: 'bg-warning-100', text: 'text-warning-700', icon: AlertCircle };
              case 'waiting_human': return { bg: 'bg-warning-100', text: 'text-warning-700', icon: Clock };
              case 'resolved': return { bg: 'bg-success-100', text: 'text-success-700', icon: CheckCircle };
              case 'closed': return { bg: 'bg-neutral-100', text: 'text-neutral-700', icon: CheckCircle };
              default: return { bg: 'bg-neutral-100', text: 'text-neutral-700', icon: AlertCircle };
            }
          };
          
          const config = getStatusConfig(ticket._id);
          const Icon = config.icon;
          
          return (
            <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl ${config.bg} flex items-center justify-center`}>
                  <Icon className={`h-4 w-4 ${config.text}`} />
                </div>
                <span className="font-mulish font-semibold text-neutral-900 capitalize">
                  {ticket._id.replace('_', ' ')}
                </span>
              </div>
              <Badge variant="accent" size="sm" className="font-mulish font-bold">
                {ticket.count}
              </Badge>
            </div>
          );
        })}
      </div>
    );

    const renderSuggestionPerformance = (suggestions: any[]) => {
      const suggestion = suggestions?.[0] || {};
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-xl bg-primary-50">
              <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-primary-500 flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
              <p className="text-xs font-mulish font-bold text-primary-600 uppercase tracking-wider mb-1">
                Confidence
              </p>
              <p className="text-2xl font-mulish font-bold text-primary-800">
                {((suggestion.avgConfidence || 0) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="text-center p-4 rounded-xl bg-success-50">
              <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-success-500 flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <p className="text-xs font-mulish font-bold text-success-600 uppercase tracking-wider mb-1">
                Auto-Close
              </p>
              <p className="text-2xl font-mulish font-bold text-success-800">
                {((suggestion.autoCloseRate || 0) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl bg-warning-50">
              <p className="text-xs font-mulish font-bold text-warning-600 uppercase tracking-wider">
                Total
              </p>
              <p className="text-lg font-mulish font-bold text-warning-800">
                {suggestion.totalSuggestions || 0}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-success-50">
              <p className="text-xs font-mulish font-bold text-success-600 uppercase tracking-wider">
                Auto-Closed
              </p>
              <p className="text-lg font-mulish font-bold text-success-800">
                {suggestion.autoClosedCount || 0}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-primary-50">
              <p className="text-xs font-mulish font-bold text-primary-600 uppercase tracking-wider">
                Avg Latency
              </p>
              <p className="text-lg font-mulish font-bold text-primary-800">
                {(suggestion.avgLatency || 0).toFixed(0)}ms
              </p>
            </div>
          </div>
        </div>
      );
    };

    const renderUsersByRole = (users: any[]) => (
      <div className="space-y-3">
        {users.map((user, index) => {
          const getRoleConfig = (role: string) => {
            switch (role) {
              case 'admin': return { bg: 'bg-red-100', text: 'text-red-700', icon: Shield };
              case 'agent': return { bg: 'bg-primary-100', text: 'text-primary-700', icon: UserCheck };
              case 'user': return { bg: 'bg-neutral-100', text: 'text-neutral-700', icon: Users };
              default: return { bg: 'bg-neutral-100', text: 'text-neutral-700', icon: Users };
            }
          };
          
          const config = getRoleConfig(user._id);
          const Icon = config.icon;
          
          return (
            <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl ${config.bg} flex items-center justify-center`}>
                  <Icon className={`h-4 w-4 ${config.text}`} />
                </div>
                <span className="font-mulish font-semibold text-neutral-900 capitalize">
                  {user._id}
                </span>
              </div>
              <Badge variant="accent" size="sm" className="font-mulish font-bold">
                {user.count}
              </Badge>
            </div>
          );
        })}
      </div>
    );

    const getCardIcon = (title: string) => {
      switch (title) {
        case 'Tickets by Status': return MessageSquare;
        case 'Suggestion Performance': return TrendingUp;
        case 'Users by Role': return Users;
        default: return Activity;
      }
    };

    const getCardColor = (title: string) => {
      switch (title) {
        case 'Tickets by Status': return 'primary';
        case 'Suggestion Performance': return 'warning';
        case 'Users by Role': return 'success';
        default: return 'primary';
      }
    };

    const Icon = getCardIcon(card.title);
    const color = getCardColor(card.title);

    return (
      <ModernCard variant="profile">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl bg-${color}-100 flex items-center justify-center`}>
              <Icon className={`h-6 w-6 text-${color}-600`} />
            </div>
            <div>
              <h3 className="text-lg font-mulish font-bold text-neutral-900">{card.title}</h3>
              <p className="text-sm font-mulish font-medium text-neutral-500">
                {card.title === 'Tickets by Status' && 'Current ticket distribution'}
                {card.title === 'Suggestion Performance' && 'AI system performance metrics'}
                {card.title === 'Users by Role' && 'User role distribution'}
              </p>
            </div>
          </div>
          
          <div>
            {card.title === 'Tickets by Status' && renderTicketsByStatus(card.content || [])}
            {card.title === 'Suggestion Performance' && renderSuggestionPerformance(card.content || [])}
            {card.title === 'Users by Role' && renderUsersByRole(card.content || [])}
          </div>
        </div>
      </ModernCard>
    );
  };

  const QuickStats: React.FC = () => {
    if (!data) return null;
    
    const totalTickets = data.tickets?.reduce((sum: number, t: any) => sum + t.count, 0) || 0;
    const totalUsers = data.users?.reduce((sum: number, u: any) => sum + u.count, 0) || 0;
    const avgConfidence = data.suggestions?.[0]?.avgConfidence || 0;
    const autoCloseRate = data.suggestions?.[0]?.autoCloseRate || 0;

    const stats = [
      {
        title: 'Total Tickets',
        value: totalTickets,
        icon: MessageSquare,
        color: 'primary',
        bg: 'bg-primary-100',
        text: 'text-primary-700'
      },
      {
        title: 'Total Users',
        value: totalUsers,
        icon: Users,
        color: 'success',
        bg: 'bg-success-100',
        text: 'text-success-700'
      },
      {
        title: 'Avg Confidence',
        value: `${(avgConfidence * 100).toFixed(1)}%`,
        icon: TrendingUp,
        color: 'warning',
        bg: 'bg-warning-100',
        text: 'text-warning-700'
      },
      {
        title: 'Auto-Close Rate',
        value: `${(autoCloseRate * 100).toFixed(1)}%`,
        icon: CheckCircle,
        color: 'accent',
        bg: 'bg-accent-100',
        text: 'text-accent-700'
      }
    ];

    return (
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <ModernCard key={index} variant="profile">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`h-7 w-7 ${stat.text}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-mulish font-bold text-neutral-400 uppercase tracking-wider mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-mulish font-bold text-neutral-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </ModernCard>
          );
        })}
      </div>
    );
  };

  return (
    <AdminLayout title="System Metrics">
      <div className="space-y-8">
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



