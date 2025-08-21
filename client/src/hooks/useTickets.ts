import { useEffect, useState } from 'react';
import { useTicketsStore } from '../store/tickets';

export function useTickets(auto = true) {
  const { items, total, loading, error, fetchTickets, createTicket, addReply, assignTicket } = useTicketsStore();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<undefined | 'open' | 'triaged' | 'waiting_human' | 'resolved' | 'closed'>(undefined);
  useEffect(() => { if (auto) { fetchTickets({ my: true, page, pageSize: 10, status }); } }, [auto, page, status, fetchTickets]);
  return { items, total, loading, error, fetchTickets, createTicket, addReply, assignTicket, page, setPage, status, setStatus };
}

export default useTickets;


