import { WebSocketServer, WebSocket } from 'ws';
import { encode } from '@msgpack/msgpack';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { MarketSimulator } from './engine/simulation.js';
import { DataGenerator } from './engine/generators.js';
import { DEFAULT_SCENARIO, BURST_SCENARIO, FAILURE_SCENARIO, MALFORMED_SCENARIO, ScenarioState } from './engine/scenarios.js';
import { HeatmapGenerator } from './engine/heatmap.js';
import { getSector } from './utils/sectors.js';

const PORT = parseInt(process.env.PORT || '4000', 10);
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const symbols = [
    'BTC-USD', 'ETH-USD', 'SOL-USD', 'ARB-USD', 'OP-USD', 
    'LINK-USD', 'ADA-USD', 'DOT-USD', 'MATIC-USD', 'AVAX-USD'
];

// In-memory data structures
let historicalBuffer: any[] = [];
const BUFFER_SIZE = 20000;
const simulator = new MarketSimulator(symbols);
const generator = new DataGenerator(simulator);

// HTTP ENDPOINTS
app.get('/status', (req, res) => {
    res.json({
        status: 'UP',
        uptime: process.uptime(),
        clients: clients.size,
        bufferSize: historicalBuffer.length,
        currentScenario: currentScenario.mode,
        malformedRate: currentScenario.malformedRate
    });
});

app.get('/symbols', (req, res) => {
    // Return enriched symbol metadata
    const enriched = symbols.map(sym => ({
        symbol: sym,
        name: sym.split('-')[0] + ' Perpetual',
        sector: getSector(sym),
        baseAsset: sym.split('-')[0],
        quoteAsset: 'USD'
    }));
    res.json(enriched);
});

app.get('/history/:symbol', (req, res) => {
    const { symbol } = req.params;
    const interval = typeof req.query.interval === 'string' ? req.query.interval : undefined;
    const candles = historicalBuffer
        .filter(event => event.e === 'candle' && event.s === symbol && (!interval || event.interval === interval))
        .slice(-500); // Return last 500 candles
    res.json(candles);
});

app.get('/v1/replay', (req, res) => {
    res.json(historicalBuffer);
});

// Websocket Logic
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// HEATMAP GENERATOR
const heatmapGen = new HeatmapGenerator(symbols, (snapshot) => {
  const binary = encode(snapshot);
  clients.forEach(client => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(binary);
    }
  });
});
heatmapGen.start();

let currentScenario: ScenarioState = { ...DEFAULT_SCENARIO };
let ticker: NodeJS.Timeout | null = null;
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

  ws.send(JSON.stringify({ type: 'welcome', id, symbols }));
  sendReplayState(client);
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
      if (typeof message.index === 'number' && Number.isFinite(message.index)) {
        replayCursor = Math.max(0, Math.min(historicalBuffer.length - 1, Math.floor(message.index)));
      } else if (replayCursor >= historicalBuffer.length) {
        replayCursor = 0;
      }
      playbackSpeed = message.speed || 1;
      console.log(`[Server] Entering REPLAY mode at ${playbackSpeed}x`);
      sendReplayState(client);
      restartTicker();
      break;
    case 'replay-stop':
      isReplaying = false;
      console.log(`[Server] Returning to LIVE mode`);
      sendReplayState(client);
      restartTicker();
      break;
    case 'replay-seek':
      replayCursor = Math.max(0, Math.min(historicalBuffer.length - 1, message.index));
      sendReplayState(client);
      break;
  }
}

function handleScenarioChange(mode: string) {
  isReplaying = false;
  switch (mode) {
    case 'BURST':
      currentScenario = { ...BURST_SCENARIO };
      break;
    case 'FAILURE':
      currentScenario = { ...FAILURE_SCENARIO };
      break;
    case 'MALFORMED':
      currentScenario = { ...MALFORMED_SCENARIO };
      break;
    default:
      currentScenario = { ...DEFAULT_SCENARIO };
      break;
  }
  console.log(`[Server] Scenario changed to: ${currentScenario.mode}`);
  restartTicker();
}

function startTicker() {
  if (ticker) return;

  const run = () => {
    if (isReplaying && historicalBuffer.length > 0) {
        for (let i = 0; i < playbackSpeed; i++) {
            if (replayCursor < historicalBuffer.length) {
                const event = historicalBuffer[replayCursor];
                broadcast(event.sym || 'BTC-USD', event, true);
                replayCursor++;
                if (replayCursor % 25 === 0 || replayCursor >= historicalBuffer.length) {
                  clients.forEach(sendReplayState);
                }
            } else {
                isReplaying = false;
                console.log(`[Server] Replay finished`);
                clients.forEach(sendReplayState);
                break;
            }
        }
        ticker = setTimeout(run, 100);
    } else {
        symbols.forEach(symbol => {
          const iterations = currentScenario.mode === 'BURST' ? currentScenario.burstMultiplier : 1;
          for (let i = 0; i < iterations; i++) {
            if (Math.random() > 0.8) {
              const trade = generator.generateTrade(symbol);
              // Feed price to heatmap generator
              heatmapGen.updatePrices(symbol, parseFloat(trade.p), parseFloat(trade.p) * parseFloat(trade.q));
              broadcast(symbol, trade);
            }
            if (Date.now() % 500 < 100) broadcast(symbol, generator.generateOrderBook(symbol));
            // Generate candles for ALL intervals (1m, 5m, 15m, 1h, 1D)
            const candleEvents = generator.generateCandlesForSymbol(symbol);
            for (const candleEvent of candleEvents) {
              broadcast(symbol, candleEvent);
            }
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

function broadcast(symbol: string, event: any, isReplay = false) {
  if (!isReplay) {
      historicalBuffer.push(event);
      if (historicalBuffer.length > BUFFER_SIZE) {
          historicalBuffer.shift();
      }
  }

  if (!isReplay && currentScenario.mode === 'FAILURE' && Math.random() < currentScenario.failureRate) {
    return;
  }

  // Malformed payload simulation: intentionally corrupt the event
  let payload: Uint8Array;
  if (!isReplay && currentScenario.mode === 'MALFORMED' && Math.random() < currentScenario.malformedRate) {
    const corruptionType = Math.random();
    if (corruptionType < 0.25) {
      // Truncated binary (partial MessagePack)
      const full = encode(event);
      payload = full.slice(0, Math.max(1, Math.floor(full.length * 0.5)));
    } else if (corruptionType < 0.5) {
      // Random garbage bytes
      const len = Math.floor(Math.random() * 50) + 5;
      payload = new Uint8Array(len);
      crypto.getRandomValues(payload as any);
    } else if (corruptionType < 0.75) {
      // Invalid JSON string (instead of MessagePack)
      payload = new TextEncoder().encode(`{"invalid":true,"type":"__corrupted__","data":null,}`);
    } else {
      // Empty payload
      payload = new Uint8Array(0);
    }
  } else {
    payload = encode(event);
  }

  clients.forEach(client => {
    if (client.subscriptions.has(symbol) && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  });
}

function sendReplayState(client: Client) {
  if (client.ws.readyState !== WebSocket.OPEN) return;
  client.ws.send(JSON.stringify({
    type: 'replay-state',
    mode: isReplaying ? 'REPLAY' : 'LIVE',
    playing: isReplaying,
    cursor: replayCursor,
    total: historicalBuffer.length,
    speed: playbackSpeed,
    completed: !isReplaying && historicalBuffer.length > 0 && replayCursor >= historicalBuffer.length - 1,
  }));
}

startTicker();

server.listen(PORT, () => {
  console.log(`[Server] TradeGrid Mock Stream Backend running on http/ws://localhost:${PORT}`);
});

// Graceful shutdown handling
function gracefulShutdown(signal: string) {
  console.log(`[Server] Received ${signal}. Shutting down gracefully...`);

  // Stop the heatmap generator
  heatmapGen.stop();

  // Stop the ticker
  if (ticker) {
    clearTimeout(ticker);
    ticker = null;
  }

  // Notify and close all WebSocket clients
  const shutdownMessage = JSON.stringify({ type: 'shutdown', message: 'Server is shutting down' });
  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(shutdownMessage);
      client.ws.close(1001, 'Server shutting down');
    }
  });

  // Close the HTTP server (which also closes the WebSocket server)
  server.close(() => {
    console.log('[Server] HTTP server closed.');
    process.exit(0);
  });

  // Force exit after 5 seconds if graceful shutdown fails
  setTimeout(() => {
    console.error('[Server] Forced shutdown after timeout.');
    process.exit(1);
  }, 5000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
