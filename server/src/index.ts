import { WebSocketServer, WebSocket } from 'ws';
import { encode } from '@msgpack/msgpack';
import http from 'http';

const PORT = process.env.PORT || 4000;
const server = http.createServer();
const wss = new WebSocketServer({ server });

interface Client {
  ws: WebSocket;
  id: string;
  subscriptions: Set<string>;
}

const clients = new Map<string, Client>();

wss.on('connection', (ws) => {
  const id = Math.random().toString(36).substring(2, 11);
  const client: Client = { ws, id, subscriptions: new Set() };
  clients.set(id, client);

  console.log(`[Server] Client connected: ${id} (Total: ${clients.size})`);

  ws.on('message', (data) => {
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

  // Send welcome message
  send(client, { type: 'welcome', id });
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
      send(client, { type: 'pong', timestamp: Date.now() });
      break;
  }
}

function send(client: Client, data: any) {
  if (client.ws.readyState === WebSocket.OPEN) {
    // We will use MessagePack for binary data in production data flows, 
    // but for control messages (welcome/pong), we use JSON for now 
    // or we can just encode everything for consistency.
    // LEAVING JSON FOR NOW for easy debugging until generators are ready.
    client.ws.send(JSON.stringify(data));
  }
}

server.listen(PORT, () => {
  console.log(`[Server] Mock Stream Backend running on ws://localhost:${PORT}`);
});
