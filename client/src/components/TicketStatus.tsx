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
  
  const label = status.replace('_', ' ');
  
  return (
    <Badge 
      variant={getStatusVariant(status) as any} 
      size="sm"
      className="capitalize font-mulish font-bold"
    >
      {label}
    </Badge>
  );
};

export default TicketStatus;



