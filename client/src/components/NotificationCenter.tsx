import React, { useEffect, useState, createContext, useContext } from 'react';
import wsClient from '../lib/ws';
import { ModernCard } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Bell, 
  CheckCircle, 
  User, 
  X,
  Clock
} from 'lucide-react';

interface Notice { 
  id: string; 
  event: string; 
  payload: any; 
  time: string; 
}

interface NotificationContextType {
  notices: Notice[];
  notificationCount: number;
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const offStatus = wsClient.on('ticket_status', (payload) => {
      console.log('📧 Received ticket_status notification:', payload);
      setNotices(n => [{ 
        id: String(Date.now()), 
        event: 'ticket_status', 
        payload, 
        time: new Date().toISOString() 
      }, ...n]);
    });
    
    const offAssign = wsClient.on('ticket_assigned', (payload) => {
      console.log('📧 Received ticket_assigned notification:', payload);
      setNotices(n => [{ 
        id: String(Date.now()), 
        event: 'ticket_assigned', 
        payload, 
        time: new Date().toISOString() 
      }, ...n]);
    });
    
    const offReply = wsClient.on('ticket_reply', (payload) => {
      console.log('📧 Received ticket_reply notification:', payload);
      setNotices(n => [{ 
        id: String(Date.now()), 
        event: 'ticket_reply', 
        payload, 
        time: new Date().toISOString() 
      }, ...n]);
    });
    
    return () => { 
      offStatus(); 
      offAssign();
      offReply();
    };
  }, []);

  const clearNotification = (id: string) => {
    setNotices(notices => notices.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotices([]);
    setIsExpanded(false);
  };

  const value = {
    notices,
    notificationCount: notices.length,
    isExpanded,
    setIsExpanded,
    clearNotification,
    clearAllNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Notification Bell Component for Navigation Bars
export const NotificationBell: React.FC<{ className?: string }> = ({ className }) => {
  const { notificationCount, isExpanded, setIsExpanded } = useNotifications();

  if (notificationCount === 0) {
    return (
      <button className={`rounded-2xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all ${className || 'w-10 h-10'}`}>
        <Bell className="h-5 w-5 text-white" />
      </button>
    );
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`rounded-2xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all ${className || 'w-10 h-10'}`}
      >
        <Bell className="h-5 w-5 text-white" />
      </button>
      <div className="absolute -top-1 -right-1 w-5 h-5 bg-warning-500 rounded-full flex items-center justify-center">
        <span className="text-xs font-mulish font-bold text-white">
          {notificationCount > 9 ? '9+' : notificationCount}
        </span>
      </div>
    </div>
  );
};

export const NotificationCenter: React.FC = () => {
  const { 
    notices, 
    notificationCount, 
    isExpanded, 
    setIsExpanded, 
    clearNotification, 
    clearAllNotifications 
  } = useNotifications();

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getNotificationIcon = (event: string) => {
    switch (event) {
      case 'ticket_status':
        return <CheckCircle className="w-5 h-5 text-success-500" />;
      case 'ticket_assigned':
        return <User className="w-5 h-5 text-primary-500" />;
      case 'ticket_reply':
        return <Bell className="w-5 h-5 text-warning-500" />;
      default:
        return <Bell className="w-5 h-5 text-neutral-400" />;
    }
  };

  const getNotificationTitle = (event: string) => {
    switch (event) {
      case 'ticket_status':
        return 'Status Updated';
      case 'ticket_assigned':
        return 'Ticket Assigned';
      case 'ticket_reply':
        return 'New Reply';
      default:
        return 'Notification';
    }
  };

  const getNotificationMessage = (notice: Notice) => {
    switch (notice.event) {
      case 'ticket_status':
        const statusPayload = notice.payload;
        const ticketTitle = statusPayload.ticketTitle ? ` "${statusPayload.ticketTitle}"` : '';
        const updatedBy = statusPayload.updatedBy ? ` by ${statusPayload.updatedBy}` : '';
        const assigneeName = statusPayload.assigneeName ? ` to ${statusPayload.assigneeName}` : '';
        return `Ticket${ticketTitle} status changed to ${statusPayload.status || 'unknown'}${updatedBy}${assigneeName}`;
      case 'ticket_assigned':
        const assignPayload = notice.payload;
        const assignTicketTitle = assignPayload.ticketTitle ? ` "${assignPayload.ticketTitle}"` : '';
        const assignedBy = assignPayload.assignedBy ? ` by ${assignPayload.assignedBy}` : '';
        return `Ticket${assignTicketTitle} has been assigned to you${assignedBy}`;
      case 'ticket_reply':
        const replyPayload = notice.payload;
        const replyTicketTitle = replyPayload.ticketTitle ? ` "${replyPayload.ticketTitle}"` : '';
        const replyAuthor = replyPayload.replyAuthor ? ` from ${replyPayload.replyAuthor}` : '';
        return `New reply${replyAuthor} on ticket${replyTicketTitle}`;
      default:
        return JSON.stringify(notice.payload);
    }
  };

  if (!isExpanded || notificationCount === 0) return null;

  return (
    <div className="fixed top-16 right-6 z-50 w-96">
      <ModernCard className="shadow-lg border border-neutral-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-primary-500" />
            <h3 className="font-mulish font-bold text-lg text-neutral-900">
              Notifications
            </h3>
            <Badge variant="accent" size="sm">
              {notificationCount}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAllNotifications}
              className="text-xs font-mulish font-semibold"
            >
              Clear All
            </Button>
            <Button 
              variant="ghost" 
              size="icon-sm" 
              onClick={() => setIsExpanded(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Notifications List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notices.slice(0, 10).map(notice => (
            <div key={notice.id} className="flex items-start gap-3 p-3 bg-neutral-50 rounded-2xl hover:bg-neutral-100 transition-colors">
              <div className="flex-shrink-0 mt-0.5">
                {getNotificationIcon(notice.event)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-mulish font-bold text-sm text-neutral-900">
                    {getNotificationTitle(notice.event)}
                  </h4>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-neutral-400" />
                      <span className="text-xs font-mulish font-medium text-neutral-400">
                        {formatTime(notice.time)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => clearNotification(notice.id)}
                      className="w-6 h-6 hover:bg-neutral-200"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm font-mulish font-medium text-neutral-600">
                  {getNotificationMessage(notice)}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {notices.length > 10 && (
          <div className="mt-4 pt-4 border-t border-neutral-200 text-center">
            <p className="text-sm font-mulish font-medium text-neutral-400">
              +{notices.length - 10} more notifications
            </p>
          </div>
        )}
      </ModernCard>
    </div>
  );
};

export default NotificationCenter;



