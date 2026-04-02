export type WebSocketStatus = 'connecting' | 'open' | 'closing' | 'closed';

export interface WebSocketManagerOptions {
  url: string;
  onMessage: (data: ArrayBuffer | string) => void;
  onStatusChange?: (status: WebSocketStatus) => void;
  onError?: (error: Event) => void;
  reconnectOptions?: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
  };
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private options: WebSocketManagerOptions;
  
  private retryCount = 0;
  private isConnecting = false;
  private shouldClosedIntentionally = false;

  constructor(options: WebSocketManagerOptions) {
    this.options = options;
    this.url = options.url;
  }

  public connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    this.shouldClosedIntentionally = false;
    this.isConnecting = true;
    this.options.onStatusChange?.('connecting');
    this.establishConnection();
  }

  public disconnect(): void {
    this.shouldClosedIntentionally = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public send(data: string | ArrayBuffer | Blob): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    }
  }

  private establishConnection(): void {
    try {
      this.ws = new WebSocket(this.url);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        this.retryCount = 0;
        this.isConnecting = false;
        this.options.onStatusChange?.('open');
      };

      this.ws.onmessage = (event) => {
        this.options.onMessage(event.data);
      };

      this.ws.onerror = (error) => {
        this.options.onError?.(error);
      };

      this.ws.onclose = () => {
        this.ws = null;
        this.options.onStatusChange?.('closed');
        
        if (!this.shouldClosedIntentionally) {
          this.handleReconnect();
        }
      };
    } catch (e) {
      this.handleReconnect();
    }
  }

  private handleReconnect(): void {
    const { maxRetries = Infinity, initialDelay = 1000, maxDelay = 30000 } = 
      this.options.reconnectOptions || {};

    if (this.retryCount >= maxRetries) {
      this.isConnecting = false;
      return;
    }

    const delay = Math.min(initialDelay * Math.pow(2, this.retryCount), maxDelay);
    this.retryCount++;
    this.isConnecting = true;

    setTimeout(() => {
      if (!this.shouldClosedIntentionally) {
        this.establishConnection();
      }
    }, delay);
  }

  public get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}
