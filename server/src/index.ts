import { WebSocketServer, WebSocket } from 'ws';
import { encode } from '@msgpack/msgpack';
import http from 'http';
import { MarketSimulator } from './engine/simulation.js';
import { DataGenerator } from './engine/generators.js';
import { DEFAULT_SCENARIO, BURST_SCENARIO, FAILURE_SCENARIO, ScenarioState } from './engine/scenarios.js';

const PORT = 4000;
const server = http.createServer();
const wss = new WebSocketServer({ server });

const symbols = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'ARB-USD', 'OP-USD'];
const simulator = new MarketSimulator(symbols);
const generator = new DataGenerator(simulator);

let currentScenario: ScenarioState = { ...DEFAULT_SCENARIO };
let ticker: NodeJS.Timeout | null = null;

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
    case 'set-scenario':
      handleScenarioChange(message.mode);
      break;
  }
}

function handleScenarioChange(mode: string) {
  switch (mode) {
    case 'BURST':
      currentScenario = { ...BURST_SCENARIO };
      break;
    case 'FAILURE':
      currentScenario = { ...FAILURE_SCENARIO };
      break;
    default:
      currentScenario = { ...DEFAULT_SCENARIO };
      break;
  }
  console.log(`[Server] Scenario changed to: ${currentScenario.mode}`);
  restartTicker();
}

// SIMULATION LOOP (Ticker)
function startTicker() {
  if (ticker) return;

  const run = () => {
    symbols.forEach(symbol => {
      const iterations = currentScenario.mode === 'BURST' ? currentScenario.burstMultiplier : 1;
      
      for (let i = 0; i < iterations; i++) {
        // 1. Generate Trade
        if (Math.random() > 0.8) {
          broadcast(symbol, generator.generateTrade(symbol));
        }

        // 2. Generate Orderbook
        if (Date.now() % 500 < 100) {
          broadcast(symbol, generator.generateOrderBook(symbol));
        }

        // 3. Generate Candle
        broadcast(symbol, generator.generateCandle(symbol));
      }
    });

    ticker = setTimeout(run, currentScenario.tickInterval);
  };

  run();
}

function restartTicker() {
  if (ticker) {
    clearTimeout(ticker);
    ticker = null;
  }
  startTicker();
}

startTicker();

/**
 * Broadcast event to all subbed clients using MessagePack (Binary)
 */
function broadcast(symbol: string, event: any) {
  // Failure simulation (drop packets)
  if (currentScenario.mode === 'FAILURE' && Math.random() < currentScenario.failureRate) {
    return;
  }

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
