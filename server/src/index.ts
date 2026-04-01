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

// Replay State
let historicalBuffer: any[] = [];
const BUFFER_SIZE = 5000;
let isReplaying = false;
let replayCursor = 0;
let playbackSpeed = 1;

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
    case 'replay-start':
      isReplaying = true;
      replayCursor = 0;
      playbackSpeed = message.speed || 1;
      console.log(`[Server] Entering REPLAY mode at ${playbackSpeed}x`);
      restartTicker();
      break;
    case 'replay-stop':
      isReplaying = false;
      console.log(`[Server] Returning to LIVE mode`);
      restartTicker();
      break;
    case 'replay-seek':
      replayCursor = Math.max(0, Math.min(historicalBuffer.length - 1, message.index));
      break;
  }
}

function handleScenarioChange(mode: string) {
  isReplaying = false; // Always exit replay when scenario changes
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
    if (isReplaying && historicalBuffer.length > 0) {
        // REPLAY MODE: Send data from buffer
        for (let i = 0; i < playbackSpeed; i++) {
            if (replayCursor < historicalBuffer.length) {
                const event = historicalBuffer[replayCursor];
                broadcast(event.s || 'BTC-USD', event, true); // true = raw replay
                replayCursor++;
            } else {
                isReplaying = false;
                console.log(`[Server] Replay finished`);
                break;
            }
        }
        ticker = setTimeout(run, 100);
    } else {
        // LIVE MODE: Generate new data
        symbols.forEach(symbol => {
          const iterations = currentScenario.mode === 'BURST' ? currentScenario.burstMultiplier : 1;
          for (let i = 0; i < iterations; i++) {
            if (Math.random() > 0.8) broadcast(symbol, generator.generateTrade(symbol));
            if (Date.now() % 500 < 100) broadcast(symbol, generator.generateOrderBook(symbol));
            broadcast(symbol, generator.generateCandle(symbol));
          }
        });
        ticker = setTimeout(run, currentScenario.tickInterval);
    }
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
function broadcast(symbol: string, event: any, isReplay = false) {
  // 1. Buffer for history (if not already a replay event)
  if (!isReplay) {
      historicalBuffer.push(event);
      if (historicalBuffer.length > BUFFER_SIZE) {
          historicalBuffer.shift();
      }
  }

  // 2. Scenario Drop simulation
  if (!isReplay && currentScenario.mode === 'FAILURE' && Math.random() < currentScenario.failureRate) {
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
});
