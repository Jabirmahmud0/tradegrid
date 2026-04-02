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
    endpoints?: string[];
  };
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private options: WebSocketManagerOptions;

  private retryCount = 0;
  private shouldClosedIntentionally = false;
  private messageQueue: (string | ArrayBuffer | Blob)[] = [];
  private currentUrl: string;

  constructor(options: WebSocketManagerOptions) {
    this.options = options;
    this.url = options.url;
    this.currentUrl = options.url;
  }

  public connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    this.shouldClosedIntentionally = false;
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
    } else if (this.ws?.readyState === WebSocket.CONNECTING) {
      this.messageQueue.push(data);
    }
  }

  private establishConnection(): void {
    try {
      console.log('[WebSocketManager] Establishing connection to:', this.url);
      this.ws = new WebSocket(this.url);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        console.log('[WebSocketManager] Connection opened');
        this.retryCount = 0;
        this.options.onStatusChange?.('open');
        while (this.messageQueue.length > 0) {
          const msg = this.messageQueue.shift();
          if (msg) this.ws!.send(msg);
        }
      };

      this.ws.onmessage = (event) => {
        console.log('[WebSocketManager] Message received:', typeof event.data, event.data instanceof ArrayBuffer ? `${event.data.byteLength} bytes` : event.data.substring(0, 100));
        this.options.onMessage(event.data);
      };

      this.ws.onerror = (error) => {
        // WebSocket error events don't contain details - the actual error is usually in the console
        // or followed by a close event with error code
        console.error('[WebSocketManager] WebSocket error event. Check network tab for details.');
        console.error('[WebSocketManager] URL:', this.currentUrl);
        console.error('[WebSocketManager] ReadyState:', this.ws?.readyState);
        this.options.onError?.(error);
      };

      this.ws.onclose = (event) => {
        console.log('[WebSocketManager] Connection closed:', event.code, event.reason || 'No reason provided');
        console.log('[WebSocketManager] Closed from URL:', this.currentUrl);
        this.ws = null;
        this.options.onStatusChange?.('closed');

        if (!this.shouldClosedIntentionally) {
          this.handleReconnect();
        }
      };
    } catch (e) {
      console.error('[WebSocketManager] Exception establishing connection:', e);
      this.handleReconnect();
    }
  }

  private handleReconnect(): void {
    const { maxRetries = Infinity, initialDelay = 1000, maxDelay = 30000, endpoints } =
      this.options.reconnectOptions || {};

    if (this.retryCount >= maxRetries) {
      return;
    }

    // Try fallback endpoint every 2 failures
    if (this.retryCount % 2 === 0 && endpoints && endpoints.length > 1) {
      const currentIndex = endpoints.findIndex(ep => this.currentUrl.includes(ep));
      const nextIndex = (currentIndex + 1) % endpoints.length;
      if (nextIndex !== currentIndex) {
        // Extract streams from current URL
        const streamsMatch = this.currentUrl.match(/streams=(.+)/);
        if (streamsMatch) {
          this.currentUrl = `${endpoints[nextIndex]}/stream?streams=${streamsMatch[1]}`;
          console.log('[WebSocketManager] Switching to fallback endpoint:', this.currentUrl);
        }
      }
    }

    const delay = Math.min(initialDelay * Math.pow(2, this.retryCount), maxDelay);
    this.retryCount++;

    console.log(`[WebSocketManager] Reconnecting in ${delay}ms... (attempt ${this.retryCount})`);

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
