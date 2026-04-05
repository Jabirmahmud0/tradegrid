export type WebSocketStatus = 'connecting' | 'open' | 'closing' | 'closed' | 'error';

export interface WebSocketManagerOptions {
  url: string;
  onMessage: (data: ArrayBuffer | string) => void;
  onStatusChange?: (status: WebSocketStatus) => void;
  onError?: (error: Event | string) => void;
  reconnectOptions?: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    endpoints?: string[];
    connectionTimeout?: number; // ms to wait before considering connection failed
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
  private connectionTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(options: WebSocketManagerOptions) {
    this.options = options;
    this.url = options.url;
    this.currentUrl = options.url;
  }

  public connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    this.shouldClosedIntentionally = false;
    this.currentUrl = this.url;
    this.options.onStatusChange?.('connecting');
    this.establishConnection();
  }

  public disconnect(): void {
    this.shouldClosedIntentionally = true;
    this.retryCount = 0;
    if (this.connectionTimeoutId) {
      clearTimeout(this.connectionTimeoutId);
      this.connectionTimeoutId = null;
    }
    if (this.ws) {
      this.ws.close(1000, 'Client disconnected');
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
    // Clear any existing timeout
    if (this.connectionTimeoutId) {
      clearTimeout(this.connectionTimeoutId);
      this.connectionTimeoutId = null;
    }

    const connectionTimeout = this.options.reconnectOptions?.connectionTimeout ?? 10000;

    try {
      console.log('[WebSocketManager] Establishing connection to:', this.currentUrl);
      this.ws = new WebSocket(this.currentUrl);
      this.ws.binaryType = 'arraybuffer';

      // Connection timeout — if no onopen within timeout, treat as failed
      this.connectionTimeoutId = setTimeout(() => {
        if (this.ws?.readyState === WebSocket.CONNECTING) {
          console.error('[WebSocketManager] Connection timeout after', connectionTimeout, 'ms');
          this.ws.close();
          this.ws = null;
          this.connectionTimeoutId = null;
          this.options.onError?.(`Connection timeout after ${connectionTimeout}ms`);
          this.options.onStatusChange?.('error');
          this.handleReconnect();
        }
      }, connectionTimeout);

      this.ws.onopen = () => {
        if (this.connectionTimeoutId) {
          clearTimeout(this.connectionTimeoutId);
          this.connectionTimeoutId = null;
        }
        console.log('[WebSocketManager] Connection opened to:', this.currentUrl);
        this.retryCount = 0;
        this.options.onStatusChange?.('open');
        while (this.messageQueue.length > 0) {
          const msg = this.messageQueue.shift();
          if (msg) this.ws!.send(msg);
        }
      };

      this.ws.onmessage = (event) => {
        const dataSize = event.data instanceof ArrayBuffer
          ? `${event.data.byteLength} bytes`
          : typeof event.data === 'string' ? `${event.data.length} chars` : 'blob';
        console.log('[WebSocketManager] Message received:', typeof event.data, dataSize);
        this.options.onMessage(event.data);
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocketManager] WebSocket error event');
        console.error('[WebSocketManager] URL:', this.currentUrl, 'ReadyState:', this.ws?.readyState);
        this.options.onError?.(error);
      };

      this.ws.onclose = (event) => {
        if (this.connectionTimeoutId) {
          clearTimeout(this.connectionTimeoutId);
          this.connectionTimeoutId = null;
        }
        const wasOpen = event.code === 1000 || event.code === 1001;
        const wasError = event.code === 1006 || event.code === 1011;
        console.log('[WebSocketManager] Connection closed:', event.code, event.reason || 'No reason',
          wasError ? '(ERROR)' : wasOpen ? '(NORMAL)' : '(UNKNOWN)');
        this.ws = null;

        if (wasError && !this.shouldClosedIntentionally) {
          this.options.onStatusChange?.('error');
          this.options.onError?.(`Connection closed with error code ${event.code}`);
        } else {
          this.options.onStatusChange?.('closed');
        }

        if (!this.shouldClosedIntentionally) {
          this.handleReconnect();
        }
      };
    } catch (e) {
      console.error('[WebSocketManager] Exception establishing connection:', e);
      if (this.connectionTimeoutId) {
        clearTimeout(this.connectionTimeoutId);
        this.connectionTimeoutId = null;
      }
      this.options.onStatusChange?.('error');
      this.options.onError?.(e instanceof Error ? e.message : String(e));
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
