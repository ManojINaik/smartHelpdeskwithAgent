import React, { useMemo, useState } from 'react';
import TicketStatus from './TicketStatus';
import { useTickets } from '../hooks/useTickets';
import { Link } from 'react-router-dom';
import { ModernCard } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { 
  ChevronLeft, 
  ChevronRight, 
  Filter,
  SortAsc,
  MessageSquare,
  Calendar,
  User,
  Clock
} from 'lucide-react';

export const TicketList: React.FC = () => {
  const { items, loading, error, page, setPage, total, status, setStatus, filter, setFilter, userRole } = useTickets();
  const [sort, setSort] = useState<'newest' | 'oldest' | 'status'>('newest');
  const totalPages = Math.max(1, Math.ceil(total / 10));
  
  const sorted = useMemo(() => {
    const c = [...items];
    if (sort === 'newest') return c.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    if (sort === 'oldest') return c.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
    return c.sort((a, b) => a.status.localeCompare(b.status));
  }, [items, sort]);
  
  const showFilterOptions = userRole === 'admin' || userRole === 'agent';
  
  const getStatusColor = (ticketStatus: string) => {
    switch (ticketStatus) {
      case 'open': return 'text-primary-500';
      case 'triaged': return 'text-warning-500';
      case 'waiting_human': return 'text-warning-400';
      case 'resolved': return 'text-success-500';
      case 'closed': return 'text-neutral-500';
      default: return 'text-neutral-400';
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Modern Filter Controls */}
      <ModernCard variant="profile" className="shadow-soft">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary-500" />
            <span className="font-mulish font-bold text-base text-neutral-900">
              Tickets
            </span>
            <Badge variant="accent" size="sm">
              {total} total
            </Badge>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {showFilterOptions && (
              <div className="flex items-center gap-2">
                <Label variant="modern" size="sm">Filter</Label>
                <Select value={filter || 'all'} onValueChange={(value) => setFilter(value as any)}>
                  <SelectTrigger className="w-36 h-9 rounded-2xl font-mulish font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {userRole === 'admin' && <SelectItem value="all">All Tickets</SelectItem>}
                    <SelectItem value="my">My Tickets</SelectItem>
                    <SelectItem value="assigned">Assigned to Me</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Label variant="modern" size="sm">Status</Label>
              <Select value={status || 'all'} onValueChange={(value) => setStatus(value === 'all' ? undefined : value as any)}>
                <SelectTrigger className="w-32 h-9 rounded-2xl font-mulish font-semibold">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="triaged">Triaged</SelectItem>
                  <SelectItem value="waiting_human">Waiting Human</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <SortAsc className="w-4 h-4 text-neutral-400" />
              <Select value={sort} onValueChange={(value) => setSort(value as any)}>
                <SelectTrigger className="w-28 h-9 rounded-2xl font-mulish font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="text-sm font-mulish font-medium text-neutral-400">
            Page {page} of {totalPages}
          </div>
        </div>
      </ModernCard>

      {/* Loading State */}
      {loading && (
        <ModernCard className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="font-mulish font-semibold text-neutral-400">Loading tickets...</p>
        </ModernCard>
      )}
      
      {/* Error State */}
      {error && (
        <ModernCard className="border-2 border-red-200 bg-red-50">
          <p className="font-mulish font-semibold text-red-700 text-center">{error}</p>
        </ModernCard>
      )}

      {/* Tickets List */}
      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map(t => (
            <ModernCard key={t._id} variant="profile" className="hover:shadow-xl transition-all duration-200 hover:-translate-y-1 shadow-soft">
              <div className="space-y-3">
                {/* Ticket Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Link 
                      to={`/tickets/${t._id}`} 
                      className="font-mulish font-bold text-base text-primary-800 hover:text-primary-600 transition-colors line-clamp-2"
                    >
                      {t.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-3 h-3 text-neutral-400" />
                      <span className="text-xs font-mulish font-medium text-neutral-400">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <TicketStatus status={t.status} />
                </div>
                
                {/* Ticket Description */}
                <p className="text-sm font-mulish font-medium text-neutral-600 line-clamp-2">
                  {t.description}
                </p>
                
                {/* Ticket Meta Info */}
                <div className="flex items-center justify-between pt-2 border-t border-neutral-200">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-neutral-400" />
                      <span className="text-xs font-mulish font-semibold text-neutral-400">
                        {t.category || 'General'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 text-neutral-400" />
                      <span className="text-xs font-mulish font-semibold text-neutral-400">
                        Unassigned
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </ModernCard>
          ))}
        </div>
      )}
      
      {/* Empty State */}
      {!loading && !error && sorted.length === 0 && (
        <ModernCard className="text-center py-16">
          <MessageSquare className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-xl font-mulish font-bold text-neutral-600 mb-2">
            No tickets found
          </h3>
          <p className="font-mulish font-medium text-neutral-400">
            Try adjusting your filters or create a new ticket
          </p>
        </ModernCard>
      )}

      {/* Modern Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button 
            variant="outline" 
            size="lg"
            disabled={page <= 1} 
            onClick={() => setPage(page - 1)}
            className="font-mulish font-semibold"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, page - 2) + i;
              if (pageNum > totalPages) return null;
              
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setPage(pageNum)}
                  className="w-10 h-10 font-mulish font-semibold"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          
          <Button 
            variant="outline" 
            size="lg"
            disabled={page >= totalPages} 
            onClick={() => setPage(page + 1)}
            className="font-mulish font-semibold"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default TicketList;


