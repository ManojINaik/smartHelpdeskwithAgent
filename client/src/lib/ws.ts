export class WSClient {
  private socket?: WebSocket;
  private listeners = new Map<string, Set<(payload: any) => void>>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(userId: string) {
    if (!userId || userId === 'undefined') {
      console.warn('WebSocket: Invalid userId, skipping connection');
      return;
    }

    const url = (import.meta.env.VITE_WS_URL || 'ws://localhost:3000') + `/ws?userId=${encodeURIComponent(userId)}`;
    
    try {
      this.socket = new WebSocket(url);
      
      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
      };
      
      this.socket.onmessage = (ev) => {
        try {
          const { event, payload } = JSON.parse(ev.data);
          const set = this.listeners.get(event);
          set?.forEach(fn => fn(payload));
        } catch (error) {
          console.warn('WebSocket: Failed to parse message', error);
        }
      };

      this.socket.onerror = (error) => {
        console.warn('WebSocket connection error:', error);
      };

      this.socket.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.attemptReconnect(userId);
      };
    } catch (error) {
      console.warn('WebSocket: Failed to create connection:', error);
    }
  }

  private attemptReconnect(userId: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`WebSocket: Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        this.connect(userId);
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.warn('WebSocket: Max reconnection attempts reached');
    }
  }

  on(event: string, handler: (payload: any) => void) {
    const set = this.listeners.get(event) || new Set<(p: any) => void>();
    set.add(handler); 
    this.listeners.set(event, set);
    return () => set.delete(handler);
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = undefined;
    }
  }
}

export const wsClient = new WSClient();
export default wsClient;



