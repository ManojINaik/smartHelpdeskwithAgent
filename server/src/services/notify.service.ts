import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

type UserId = string;

class NotificationHub {
  private wss?: WebSocketServer;
  private userSockets = new Map<UserId, Set<WebSocket>>();

  init(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.wss.on('connection', (socket: WebSocket, req: any) => {
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const userId = url.searchParams.get('userId') || 'anon';
      const set = this.userSockets.get(userId) || new Set<WebSocket>();
      set.add(socket);
      this.userSockets.set(userId, set);
      socket.on('close', () => {
        set.delete(socket);
        if (set.size === 0) this.userSockets.delete(userId);
      });
    });
  }

  broadcastToUser(userId: UserId, event: string, payload: any) {
    const sockets = this.userSockets.get(userId);
    if (!sockets) return;
    const data = JSON.stringify({ event, payload });
    sockets.forEach(ws => { try { ws.send(data); } catch {} });
  }
}

export const Notifications = new NotificationHub();
export default Notifications;


