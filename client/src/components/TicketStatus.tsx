import React from 'react';
import { TicketStatus as TStatus } from '../store/tickets';
import { Badge } from './ui/badge';

export const TicketStatus: React.FC<{ status: TStatus }> = ({ status }) => {
  const getStatusVariant = (ticketStatus: TStatus) => {
    switch (ticketStatus) {
      case 'open': 
        return 'accent';
      case 'triaged': 
        return 'default';
      case 'waiting_human': 
        return 'warning';
      case 'resolved': 
        return 'success';
      case 'closed': 
        return 'secondary';
      default: 
        return 'secondary';
    }
  };
  
  const getStatusLabel = (status: TStatus) => {
    switch (status) {
      case 'waiting_human':
        return 'Waiting Human';
      case 'open':
        return 'Open';
      case 'triaged':
        return 'Triaged';
      case 'resolved':
        return 'Resolved';
      case 'closed':
        return 'Closed';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };
  
  return (
    <Badge 
      variant={getStatusVariant(status) as any} 
      size="sm"
      className="capitalize font-mulish font-bold whitespace-nowrap"
    >
      {getStatusLabel(status)}
    </Badge>
  );
};

export default TicketStatus;



