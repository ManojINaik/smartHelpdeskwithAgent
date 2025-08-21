export class WSClient {
  private socket?: WebSocket;
  private listeners = new Map<string, Set<(payload: any) => void>>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private currentUserId?: string;
  private isConnecting = false;

  connect(userId: string) {
    if (!userId || userId === 'undefined' || userId === 'null') {
      console.warn('🔌 WebSocket: Invalid userId, skipping connection:', userId);
      return;
    }

    // Prevent multiple simultaneous connections for the same user
    if (this.isConnecting) {
      console.log('🔌 WebSocket: Connection already in progress, skipping');
      return;
    }

    if (this.currentUserId === userId && this.socket?.readyState === WebSocket.OPEN) {
      console.log('🔌 WebSocket: Already connected for user:', userId);
      return;
    }

    this.isConnecting = true;
    this.currentUserId = userId;

    // Close existing connection if any
    if (this.socket && this.socket.readyState !== WebSocket.CLOSED) {
      console.log('🔌 WebSocket: Closing existing connection');
      this.socket.close(1000, 'Reconnecting with new user');
    }

    const url = (import.meta.env.VITE_WS_URL || 'ws://localhost:3000') + `/ws?userId=${encodeURIComponent(userId)}`;
    console.log('🔌 WebSocket: Attempting to connect to:', url);
    
    try {
      this.socket = new WebSocket(url);
      
      this.socket.onopen = () => {
        console.log('✅ WebSocket connected successfully for user:', userId);
        this.reconnectAttempts = 0;
        this.isConnecting = false;
      };
      
      this.socket.onmessage = (ev) => {
        try {
          const { event, payload } = JSON.parse(ev.data);
          console.log('📨 WebSocket message received:', { event, payload });
          const set = this.listeners.get(event);
          if (set && set.size > 0) {
            console.log(`📢 Broadcasting event "${event}" to ${set.size} listener(s)`);
            set.forEach(fn => fn(payload));
          } else {
            console.warn(`⚠️ No listeners registered for event: ${event}`);
          }
        } catch (error) {
          console.error('❌ WebSocket: Failed to parse message', error, 'Raw data:', ev.data);
        }
      };

      this.socket.onerror = (error) => {
        console.error('❌ WebSocket connection error:', error);
        this.isConnecting = false;
      };

      this.socket.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', { code: event.code, reason: event.reason, wasClean: event.wasClean });
        this.isConnecting = false;
        // Only attempt reconnect if it wasn't a clean close and we're still tracking this user
        if (!event.wasClean && this.currentUserId === userId && event.code !== 1000) {
          this.attemptReconnect(userId);
        }
      };
    } catch (error) {
      console.error('❌ WebSocket: Failed to create connection:', error);
      this.isConnecting = false;
    }
  }

  private attemptReconnect(userId: string) {
    // Don't reconnect if we're already trying to connect or if user has changed
    if (this.isConnecting || this.currentUserId !== userId) {
      console.log('🔄 WebSocket: Skipping reconnect - already connecting or user changed');
      return;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
      console.log(`🔄 WebSocket: Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
      
      setTimeout(() => {
        // Double-check the user hasn't changed during the timeout
        if (this.currentUserId === userId && !this.isConnecting) {
          this.connect(userId);
        }
      }, delay);
    } else {
      console.error('❌ WebSocket: Max reconnection attempts reached');
      this.isConnecting = false;
      this.currentUserId = undefined;
    }
  }

  on(event: string, handler: (payload: any) => void) {
    const set = this.listeners.get(event) || new Set<(p: any) => void>();
    set.add(handler); 
    this.listeners.set(event, set);
    console.log(`👂 WebSocket: Registered listener for "${event}", total listeners: ${set.size}`);
    return () => {
      set.delete(handler);
      console.log(`🗑️ WebSocket: Removed listener for "${event}", remaining: ${set.size}`);
    };
  }

  disconnect() {
    console.log('🔌 WebSocket: Manually disconnecting');
    this.isConnecting = false;
    this.currentUserId = undefined;
    if (this.socket) {
      this.socket.close(1000, 'Manual disconnect');
      this.socket = undefined;
    }
    this.reconnectAttempts = 0;
  }
}

export const wsClient = new WSClient();
export default wsClient;



