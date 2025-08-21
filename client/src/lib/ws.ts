export class WSClient {
  private socket?: WebSocket;
  private listeners = new Map<string, Set<(payload: any) => void>>();

  connect(userId: string) {
    const url = (import.meta.env.VITE_WS_URL || 'ws://localhost:3000') + `/ws?userId=${encodeURIComponent(userId)}`;
    this.socket = new WebSocket(url);
    this.socket.onmessage = (ev) => {
      try {
        const { event, payload } = JSON.parse(ev.data);
        const set = this.listeners.get(event);
        set?.forEach(fn => fn(payload));
      } catch {}
    };
  }

  on(event: string, handler: (payload: any) => void) {
    const set = this.listeners.get(event) || new Set<(p: any) => void>();
    set.add(handler); this.listeners.set(event, set);
    return () => set.delete(handler);
  }
}

export const wsClient = new WSClient();
export default wsClient;



