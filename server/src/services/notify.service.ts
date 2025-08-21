import { Server } from 'http';
let WebSocketServer: any;
let WebSocketType: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ws = require('ws');
  WebSocketServer = ws.WebSocketServer || ws.Server;
  WebSocketType = ws.WebSocket || ws;
} catch {
  // ws not available in test env; noop stubs
  WebSocketServer = class { constructor() {} on() {} };
  WebSocketType = class {};
  console.warn('Notifications: ws module not available; WebSocket server disabled (test environment?)');
}

type UserId = string;

class NotificationHub {
  // Use any here because ws types are dynamic and may be absent in tests
  private wss?: any;
  private userSockets = new Map<UserId, Set<any>>();

  init(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    console.log('🔔 WebSocket server initialized at /ws');
    this.wss.on('connection', (socket: any, req: any) => {
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const userId = url.searchParams.get('userId') || 'anon';
      const set = this.userSockets.get(userId) || new Set<any>();
      set.add(socket);
      this.userSockets.set(userId, set);
      console.log(`🔔 WS connected: userId=${userId} sockets=${set.size}`);
      socket.on('close', () => {
        set.delete(socket);
        if (set.size === 0) this.userSockets.delete(userId);
        console.log(`🔕 WS disconnected: userId=${userId} remaining=${set.size}`);
      });
    });
  }

  broadcastToUser(userId: UserId, event: string, payload: any) {
    const sockets = this.userSockets.get(userId);
    if (!sockets || sockets.size === 0) {
      console.log(`⚠️ No active sockets for user ${userId}, notification not sent: ${event}`);
      return;
    }
    
    const data = JSON.stringify({ event, payload });
    console.log(`📤 Broadcasting to user ${userId}: ${event}`, { payload, socketCount: sockets.size });
    
    let successCount = 0;
    let errorCount = 0;
    
    sockets.forEach(ws => { 
      try { 
        ws.send(data);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to send to socket for user ${userId}:`, error);
        errorCount++;
      }
    });
    
    console.log(`📤 Notification sent to user ${userId}: ${successCount} success, ${errorCount} errors`);
  }
}

export const Notifications = new NotificationHub();
export default Notifications;


