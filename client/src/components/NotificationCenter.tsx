import React, { useEffect, useState } from 'react';
import wsClient from '../lib/ws';

interface Notice { id: string; event: string; payload: any; time: string; }

export const NotificationCenter: React.FC = () => {
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => {
    const offStatus = wsClient.on('ticket_status', (payload) => {
      setNotices(n => [{ id: String(Date.now()), event: 'ticket_status', payload, time: new Date().toISOString() }, ...n]);
    });
    const offAssign = wsClient.on('ticket_assigned', (payload) => {
      setNotices(n => [{ id: String(Date.now()), event: 'ticket_assigned', payload, time: new Date().toISOString() }, ...n]);
    });
    return () => { offStatus(); offAssign(); };
  }, []);

  if (notices.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 space-y-2">
      {notices.slice(0, 5).map(n => (
        <div key={n.id} className="rounded bg-white p-3 shadow">
          <div className="text-sm font-medium">{n.event}</div>
          <div className="text-xs text-gray-700">{JSON.stringify(n.payload)}</div>
        </div>
      ))}
    </div>
  );
};

export default NotificationCenter;


