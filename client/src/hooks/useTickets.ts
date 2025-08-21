import { useEffect, useState, useRef } from 'react';
import { useTicketsStore } from '../store/tickets';
import { useAuth } from '../context/AuthContext';

export function useTickets(auto = true) {
  const { user } = useAuth();
  const { items, total, loading, error, fetchTickets, createTicket, addReply, assignTicket } = useTicketsStore();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<undefined | 'open' | 'triaged' | 'waiting_human' | 'resolved' | 'closed'>(undefined);
  const [filter, setFilter] = useState<'all' | 'my' | 'assigned' | 'unassigned'>('all');
  const lastFetchRef = useRef<string>('');
  const timeoutRef = useRef<number | null>(null);
  
  useEffect(() => { 
    let isMounted = true;
    
    if (auto && user?.id) { // Only fetch if user is authenticated and has an ID
      const params: any = { page, pageSize: 10, status };
      
      // Role-based default filtering
      if (user?.role === 'admin') {
        if (filter === 'my') params.my = true;
        else if (filter === 'assigned') params.assignedToMe = true;
        else if (filter === 'unassigned') params.unassigned = true;
        // 'all' shows everything for admin
      } else if (user?.role === 'agent') {
        if (filter === 'my') params.my = true;
        else if (filter === 'assigned') params.assignedToMe = true;
        else if (filter === 'unassigned') params.unassigned = true;
        // For 'all', do not pass any filter so server returns assigned+unassigned by default
      } else {
        // Users always see their own tickets
        params.my = true;
      }
      
      // Create a unique key for this request to prevent duplicate calls
      const requestKey = JSON.stringify({ ...params, userId: user?.id });
      
      // Only fetch if this is a different request than the last one
      if (lastFetchRef.current !== requestKey && isMounted) {
        lastFetchRef.current = requestKey;
        
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        // Add a small delay to prevent rapid successive requests
        timeoutRef.current = setTimeout(() => {
          if (isMounted) {
            fetchTickets(params);
          }
        }, 100);
      }
    } 
    
    return () => {
      isMounted = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [auto, page, status, filter, user?.role, user?.id, fetchTickets]);
  
  const refresh = () => {
    if (user?.id) {
      const params: any = { page, pageSize: 10, status };
      
      // Role-based default filtering
      if (user?.role === 'admin') {
        if (filter === 'my') params.my = true;
        else if (filter === 'assigned') params.assignedToMe = true;
        else if (filter === 'unassigned') params.unassigned = true;
        // 'all' shows everything for admin
      } else if (user?.role === 'agent') {
        if (filter === 'my') params.my = true;
        else if (filter === 'assigned') params.assignedToMe = true;
        else if (filter === 'unassigned') params.unassigned = true;
        // For 'all', do not pass any filter so server returns assigned+unassigned by default
      } else {
        // Users always see their own tickets
        params.my = true;
      }
      
      fetchTickets(params);
    }
  };

  return { 
    items, 
    total, 
    loading, 
    error, 
    fetchTickets, 
    createTicket, 
    addReply, 
    assignTicket, 
    page, 
    setPage, 
    status, 
    setStatus,
    filter,
    setFilter,
    userRole: user?.role,
    refresh
  };
}

export default useTickets;


