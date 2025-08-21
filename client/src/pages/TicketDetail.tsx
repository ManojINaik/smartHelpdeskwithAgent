import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { AdminLayout } from '../components/AdminLayout';
import { AgentNavbar } from '../components/AgentNavbar';
import { AuthLayout } from '../components/AuthLayout';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MessageSquare,
  User,
  Settings,
  Send,
  CheckCircle,
  AlertCircle,
  Info,
  History,
  Eye,
  Edit3
} from 'lucide-react';

export const TicketDetail: React.FC = () => {
  const { id } = useParams();
  const [ticket, setTicket] = useState<any>(null);
  const [audit, setAudit] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const isPrivileged = user?.role === 'admin' || user?.role === 'agent';
  const [newStatus, setNewStatus] = useState<string>('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const t = await api.get(`/api/tickets/${id}`);
        setTicket(t.data.ticket);
        const a = await api.get(`/api/audit/tickets/${id}`);
        setAudit(a.data.logs);
      } catch (err: any) {
        setError(err?.response?.data?.error?.message || 'Failed to load ticket');
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  const sendReply = async () => {
    if (!reply.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      await api.post(`/api/tickets/${id}/reply`, { content: reply });
      setReply('');
      const t = await api.get(`/api/tickets/${id}`);
      setTicket(t.data.ticket);
      const a = await api.get(`/api/audit/tickets/${id}`);
      setAudit(a.data.logs);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async () => {
    if (!newStatus || newStatus === ticket.status || updating) return;
    setUpdating(true);
    setError(null);
    try {
      await api.put(`/api/tickets/${id}/status`, { status: newStatus });
      const t = await api.get(`/api/tickets/${id}`);
      setTicket(t.data.ticket);
      const a = await api.get(`/api/audit/tickets/${id}`);
      setAudit(a.data.logs);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'triaged': return 'bg-yellow-100 text-yellow-800';
      case 'waiting_human': return 'bg-orange-100 text-orange-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="h-4 w-4" />;
      case 'triaged': return <Eye className="h-4 w-4" />;
      case 'waiting_human': return <Clock className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'closed': return <CheckCircle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLayoutComponent = () => {
    if (user?.role === 'admin') return AdminLayout;
    if (user?.role === 'agent') return AgentNavbar;
    return AuthLayout;
  };

  const LayoutComponent = getLayoutComponent();

  if (loading) {
    return (
      <LayoutComponent>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading ticket details...</p>
          </div>
        </div>
      </LayoutComponent>
    );
  }

  if (error && !ticket) {
    return (
      <LayoutComponent>
        <div className="max-w-4xl mx-auto p-6">
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        </div>
      </LayoutComponent>
    );
  }

  return (
    <LayoutComponent>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link to={user?.role === 'admin' ? '/admin/metrics' : user?.role === 'agent' ? '/agent' : '/'}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Ticket Details</h1>
            <p className="text-gray-600">View and manage ticket information</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Info Card */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{ticket.title}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Created {formatDate(ticket.createdAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {ticket?.createdBy?.name || ticket?.createdBy?.email || 'Unknown'}
                      </div>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(ticket.status)} flex items-center gap-1`}>
                    {getStatusIcon(ticket.status)}
                    {ticket.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 leading-relaxed">{ticket.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Conversation Card */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Conversation
                  <Badge variant="secondary" className="ml-auto">
                    {ticket.replies?.length || 0} replies
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Replies */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {ticket.replies?.length > 0 ? (
                    ticket.replies.map((r: any) => (
                      <div key={r._id} className="flex gap-3 p-3 rounded-lg bg-gray-50 border">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-indigo-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline" className="text-xs">
                              {r.authorType}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatDate(r.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{r.content}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No replies yet</p>
                    </div>
                  )}
                </div>

                {/* Reply Form */}
                <div className="border-t pt-4">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your reply..."
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      className="flex-1 min-h-[80px] resize-none"
                      disabled={sending}
                    />
                    <Button 
                      onClick={sendReply} 
                      disabled={!reply.trim() || sending}
                      className="self-end"
                    >
                      {sending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Management */}
            {isPrivileged && (
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Manage Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Current Status
                    </label>
                    <Badge className={`${getStatusColor(ticket.status)} flex items-center gap-1 w-fit`}>
                      {getStatusIcon(ticket.status)}
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Change Status
                    </label>
                    <Select value={newStatus || ticket.status} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="triaged">Triaged</SelectItem>
                        <SelectItem value="waiting_human">Waiting Human</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={updateStatus} 
                    disabled={!newStatus || newStatus === ticket.status || updating}
                    className="w-full"
                  >
                    {updating ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Update Status
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Audit Timeline */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Audit Timeline
                  <Badge variant="secondary" className="ml-auto">
                    {audit.length} events
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {audit.length > 0 ? (
                    audit.map((log, index) => (
                      <div key={log._id} className="relative">
                        {index !== audit.length - 1 && (
                          <div className="absolute left-4 top-8 w-px h-full bg-gray-200" />
                        )}
                        <div className="flex gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <Clock className="h-4 w-4 text-blue-600" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 pb-4">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                {log.action.replace('_', ' ').toUpperCase()}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(log.timestamp)}
                              </span>
                            </div>
                            {log.meta && Object.keys(log.meta).length > 0 && (
                              <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                                <pre className="whitespace-pre-wrap text-gray-600">
                                  {JSON.stringify(log.meta, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <History className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No audit logs available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </LayoutComponent>
  );
};

export default TicketDetail;



