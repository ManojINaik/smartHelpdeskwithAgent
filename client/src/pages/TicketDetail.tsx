import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { AdminLayout } from '../components/AdminLayout';
import { AgentNavbar } from '../components/AgentNavbar';
import { AuthLayout } from '../components/AuthLayout';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
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
  Edit3,
  Trash2
} from 'lucide-react';

export const TicketDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<any>(null);
  const [audit, setAudit] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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

  const deleteTicket = async () => {
    if (deleting) return;
    setDeleting(true);
    setError(null);
    try {
      await api.delete(`/api/tickets/${id}`);
      setShowDeleteDialog(false);
      // Navigate back to the appropriate page based on user role
      const backPath = user?.role === 'admin' ? '/admin/metrics' : user?.role === 'agent' ? '/agent' : '/';
      navigate(backPath);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to delete ticket');
      setShowDeleteDialog(false);
    } finally {
      setDeleting(false);
    }
  };

  // Check if current user can delete this ticket
  const canDeleteTicket = () => {
    if (!ticket || !user) return false;
    const isCreator = ticket.createdBy?._id === user.id || ticket.createdBy?.email === user.email;
    const isAdmin = user.role === 'admin';
    return isCreator || isAdmin;
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

  const getAuditMessage = (log: any) => {
    switch (log.action) {
      case 'TICKET_CREATED':
        return 'Ticket was created';
      case 'TRIAGE_PLANNED':
        return 'AI triage was planned';
      case 'AGENT_CLASSIFIED':
        return `AI classified as ${log.meta?.predictedCategory || 'unknown'} category`;
      case 'KB_RETRIEVED':
        return 'Knowledge base was searched';
      case 'DRAFT_GENERATED':
        return 'AI generated a draft response';
      case 'ASSIGNED_TO_HUMAN':
        return 'Assigned to human agent';
      case 'AUTO_CLOSED':
        return 'Automatically resolved by AI';
      case 'STATUS_CHANGED':
        return `Status changed to ${log.meta?.newStatus || 'unknown'}`;
      case 'REPLY_ADDED':
        return 'New reply was added';
      case 'TICKET_ASSIGNED':
        return `Ticket assigned to ${log.meta?.assigneeName || 'agent'}`;
      default:
        return log.action.replace('_', ' ').toLowerCase();
    }
  };

  const getAuditIcon = (action: string) => {
    switch (action) {
      case 'TICKET_CREATED':
        return <MessageSquare className="h-4 w-4 text-blue-600" />;
      case 'TRIAGE_PLANNED':
      case 'AGENT_CLASSIFIED':
      case 'KB_RETRIEVED':
      case 'DRAFT_GENERATED':
        return <Eye className="h-4 w-4 text-purple-600" />;
      case 'ASSIGNED_TO_HUMAN':
      case 'TICKET_ASSIGNED':
        return <User className="h-4 w-4 text-green-600" />;
      case 'AUTO_CLOSED':
      case 'STATUS_CHANGED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'REPLY_ADDED':
        return <MessageSquare className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
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
          {/* Delete Button - Only show for ticket creators and admins */}
          {canDeleteTicket() && (
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Ticket
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Ticket</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this ticket? This action cannot be undone.
                    All replies and conversation history will be permanently removed.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteDialog(false)}
                    disabled={deleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={deleteTicket}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    {deleting ? 'Deleting...' : 'Delete Ticket'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
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
                    ticket.replies.map((r: any) => {
                      const isSystemReply = r.authorType === 'system';
                      const isAgentReply = r.authorType === 'agent';
                      const isAIStructured = isSystemReply || (isAgentReply && r.content.includes('**'));
                      
                      return (
                        <div 
                          key={r._id} 
                          className={`flex gap-3 p-4 rounded-xl border transition-all hover:shadow-sm ${
                            isSystemReply 
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200' 
                              : isAgentReply
                              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex-shrink-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isSystemReply 
                                ? 'bg-blue-100 text-blue-600' 
                                : isAgentReply
                                ? 'bg-green-100 text-green-600'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {isSystemReply ? (
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              ) : (
                                <User className="h-5 w-5" />
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs font-medium ${
                                    isSystemReply 
                                      ? 'border-blue-300 text-blue-700 bg-blue-50' 
                                      : isAgentReply
                                      ? 'border-green-300 text-green-700 bg-green-50'
                                      : 'border-gray-300 text-gray-700 bg-gray-50'
                                  }`}
                                >
                                  {isSystemReply ? '🤖 AI Assistant' : isAgentReply ? '👨‍💼 Support Agent' : '👤 Customer'}
                                </Badge>
                                {isSystemReply && (
                                  <Badge variant="secondary" className="text-xs">
                                    Auto-Generated
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-gray-500 font-medium">
                                {formatDate(r.createdAt)}
                              </span>
                            </div>
                            
                            {/* Render content with markdown for structured AI responses */}
                            {isAIStructured ? (
                              <div className="bg-white rounded-lg p-4 border border-opacity-50">
                                <MarkdownRenderer 
                                  content={r.content} 
                                  className="text-sm prose-sm"
                                />
                              </div>
                            ) : (
                              <div className="bg-white rounded-lg p-3 border border-opacity-30">
                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                  {r.content}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <h3 className="font-medium text-gray-600 mb-1">No conversation yet</h3>
                      <p className="text-sm">Start the conversation by sending a reply below</p>
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
                  Activity Timeline
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
                            <div className="w-8 h-8 rounded-full bg-gray-50 border-2 border-white shadow-sm flex items-center justify-center">
                              {getAuditIcon(log.action)}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 pb-4">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                {getAuditMessage(log)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(log.timestamp)}
                              </span>
                            </div>
                            {log.meta?.confidence && (
                              <div className="text-xs text-gray-500">
                                Confidence: {Math.round(log.meta.confidence * 100)}%
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <History className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No activity logs available</p>
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



