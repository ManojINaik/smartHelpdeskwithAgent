import React from 'react';
import { TicketStatus as TStatus } from '../store/tickets';

export const TicketStatus: React.FC<{ status: TStatus } > = ({ status }) => {
  const color = {
    open: 'bg-gray-200 text-gray-800',
    triaged: 'bg-indigo-100 text-indigo-800',
    waiting_human: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-red-100 text-red-800',
  }[status];
  const label = status.replace('_', ' ');
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${color}`}>{label}</span>;
};

export default TicketStatus;


