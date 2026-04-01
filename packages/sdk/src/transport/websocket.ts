import type { RemoteConfig } from '../types/index.js';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface TransportEvents {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  onMessage?: (data: any) => void;
}

export class WebSocketTransport {
  private ws: WebSocket | null = null;
  private serverUrl: string;
  private state: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private readonly reconnectDelay = 3000;
  private events: TransportEvents;
  private messageQueue: string[] = [];
  private readonly maxQueueSize = 100;
  private shouldReconnect = true;

  constructor(config: RemoteConfig, events: TransportEvents = {}) {
    this.serverUrl = config.server || this.getDefaultServerUrl();
    this.events = events;
  }

  private getDefaultServerUrl(): string {
    const host = window.location.hostname;
    return `ws://${host}:3000`;
  }

  connect(): void {
    if (!this.shouldReconnect) return;

    if (this.state === 'connecting' || this.state === 'connected') {
      return;
    }

    this.state = 'connecting';
    this.reconnectAttempts++;

    try {
      this.ws = new WebSocket(this.serverUrl);

      this.ws.onopen = () => {
        this.state = 'connected';
        this.reconnectAttempts = 0;
        this.events.onConnect?.();

        while (this.messageQueue.length > 0) {
          const msg = this.messageQueue.shift();
          if (msg) this.send(msg);
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.events.onMessage?.(data);
        } catch {
          // 忽略无效消息
        }
      };

      this.ws.onclose = () => {
        this.state = 'disconnected';
        this.events.onDisconnect?.();

        if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          setTimeout(() => this.connect(), this.reconnectDelay);
        }
      };

      this.ws.onerror = () => {
        this.state = 'error';
        this.events.onError?.(new Error('WebSocket connection failed'));
      };
    } catch (error) {
      this.state = 'error';
      this.events.onError?.(error as Error);
    }
  }

  send(data: string): void {
    if (this.state === 'connected' && this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(data);
      } catch (error) {
        console.error('[WebSocket] Failed to send:', error);
        this.state = 'error';
        this.events.onError?.(error as Error);
      }
    } else {
      if (this.messageQueue.length < this.maxQueueSize) {
        this.messageQueue.push(data);
      }
    }
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.state = 'disconnected';
  }

  getState(): ConnectionState {
    return this.state;
  }

  getServerUrl(): string {
    return this.serverUrl;
  }
}
