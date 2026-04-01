import { WebSocketServer, WebSocket } from 'ws';
import { encode } from '@msgpack/msgpack';
import http from 'http';
import { MarketSimulator } from './engine/simulation.js';
import { DataGenerator } from './engine/generators.js';

const PORT = 4000;
const server = http.createServer();
const wss = new WebSocketServer({ server });

const symbols = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'ARB-USD', 'OP-USD'];
const simulator = new MarketSimulator(symbols);
const generator = new DataGenerator(simulator);

interface Client {
  ws: WebSocket;
  id: string;
  subscriptions: Set<string>;
}

const clients = new Map<string, Client>();

wss.on('connection', (ws: WebSocket) => {
  const id = Math.random().toString(36).substring(2, 11);
  const client: Client = { ws, id, subscriptions: new Set() };
  clients.set(id, client);

  console.log(`[Server] Client connected: ${id} (Total: ${clients.size})`);

  ws.on('message', (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());
      handleMessage(client, message);
    } catch (err) {
      console.error(`[Server] Failed to parse message from ${id}:`, err);
    }
  });

  ws.on('close', () => {
    clients.delete(id);
    console.log(`[Server] Client disconnected: ${id} (Total: ${clients.size})`);
  });

  // Send welcome message (JSON)
  ws.send(JSON.stringify({ type: 'welcome', id, symbols }));
});

function handleMessage(client: Client, message: any) {
  switch (message.type) {
    case 'subscribe':
      if (Array.isArray(message.symbols)) {
        message.symbols.forEach((s: string) => client.subscriptions.add(s));
        console.log(`[Server] ${client.id} subscribed to: ${message.symbols.join(', ')}`);
      }
      break;
    case 'unsubscribe':
      if (Array.isArray(message.symbols)) {
        message.symbols.forEach((s: string) => client.subscriptions.delete(s));
      }
      break;
    case 'ping':
      client.ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      break;
  }
}

// SIMULATION LOOP (Ticker)
const TICK_INTERVAL = 100; // 10 ticks per second initially
setInterval(() => {
  symbols.forEach(symbol => {
    // 1. Generate Trade (chance ~20%)
    if (Math.random() > 0.8) {
      const trade = generator.generateTrade(symbol);
      broadcast(symbol, trade);
    }

    // 2. Generate Orderbook (chance ~100% every 500ms instead of every tick)
    if (Date.now() % 500 < 100) {
      const book = generator.generateOrderBook(symbol);
      broadcast(symbol, book);
    }

    // 3. Generate Candle (every tick for the demo)
    const candle = generator.generateCandle(symbol);
    broadcast(symbol, candle);
  });
}, TICK_INTERVAL);

/**
 * Broadcast event to all subbed clients using MessagePack (Binary)
 */
function broadcast(symbol: string, event: any) {
  const binaryData = encode(event);
  
  clients.forEach(client => {
    if (client.subscriptions.has(symbol) && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(binaryData);
    }
  });
}

server.listen(PORT, () => {
  console.log(`[Server] TradeGrid Mock Stream Backend running on ws://localhost:${PORT}`);
  console.log(`[Server] Simulating symbols: ${symbols.join(', ')}`);
});
