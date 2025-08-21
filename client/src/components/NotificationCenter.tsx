import React, { useEffect, useState } from 'react';
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

export const NotificationCenter: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const offStatus = wsClient.on('ticket_status', (payload) => {
      setNotices(n => [{ 
        id: String(Date.now()), 
        event: 'ticket_status', 
        payload, 
        time: new Date().toISOString() 
      }, ...n]);
    });
    
    const offAssign = wsClient.on('ticket_assigned', (payload) => {
      setNotices(n => [{ 
        id: String(Date.now()), 
        event: 'ticket_assigned', 
        payload, 
        time: new Date().toISOString() 
      }, ...n]);
    });
    
    return () => { 
      offStatus(); 
      offAssign(); 
    };
  }, []);

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
      default:
        return 'Notification';
    }
  };

  const getNotificationMessage = (notice: Notice) => {
    switch (notice.event) {
      case 'ticket_status':
        return `Ticket #${notice.payload.ticketId || 'Unknown'} status changed to ${notice.payload.status || 'unknown'}`;
      case 'ticket_assigned':
        return `Ticket #${notice.payload.ticketId || 'Unknown'} assigned to ${notice.payload.agentName || 'agent'}`;
      default:
        return JSON.stringify(notice.payload);
    }
  };

  const clearNotification = (id: string) => {
    setNotices(notices => notices.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotices([]);
    setIsExpanded(false);
  };

  if (notices.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Notification Bell */}
      <div className="relative mb-4">
        <Button
          variant="default"
          size="icon-lg"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-14 h-14 rounded-2xl shadow-card"
        >
          <Bell className="w-6 h-6" />
        </Button>
        {notices.length > 0 && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-warning-500 rounded-full flex items-center justify-center">
            <span className="text-xs font-mulish font-bold text-white">
              {notices.length > 9 ? '9+' : notices.length}
            </span>
          </div>
        )}
      </div>

      {/* Notifications Panel */}
      {isExpanded && (
        <div className="w-96 max-h-96 overflow-hidden">
          <ModernCard className="shadow-card">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-neutral-200">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-primary-500" />
                <h3 className="font-mulish font-bold text-lg text-neutral-900">
                  Notifications
                </h3>
                <Badge variant="accent" size="sm">
                  {notices.length}
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
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {notices.slice(0, 5).map(notice => (
                <div key={notice.id} className="flex items-start gap-3 p-3 bg-neutral-50 rounded-2xl">
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
            
            {notices.length > 5 && (
              <div className="mt-4 pt-4 border-t border-neutral-200 text-center">
                <p className="text-sm font-mulish font-medium text-neutral-400">
                  +{notices.length - 5} more notifications
                </p>
              </div>
            )}
          </ModernCard>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;



