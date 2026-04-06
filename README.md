# TradeGrid

TradeGrid is a high-performance crypto market dashboard built around:
- WebSocket streaming (Mock server or Binance mainnet/testnet)
- A Web Worker decode/normalize pipeline
- A main-thread `requestAnimationFrame` flush loop
- Canvas-first rendering for the hottest views (chart/heatmap/depth)

This repo contains:
- `src/`: Vite + React frontend
- `server/`: Node.js mock market data backend (WebSocket + HTTP)

## Quickstart

Prereqs: Node.js 20+ and npm.

Install deps:

```bash
npm install
npm install --prefix server
```

Run frontend + mock server together:

```bash
npm run dev:all
```

Endpoints:
- UI: `http://localhost:5173`
- Mock WS: `ws://localhost:4000`
- Mock HTTP: `http://localhost:4000`

Run them separately:

```bash
npm run dev
npm run mock-server
```

## Data Sources

Use the top-right "Data Source" switcher:
- Mock Server: local simulator (WebSocket + HTTP)
- Binance Testnet: live websocket streams (no keys)
- Binance Mainnet: live websocket streams (no keys)

Notes:
- Binance modes stream trades for a small watchlist and stream depth + klines for the focused symbol.
- Mock mode provides trades, order book, candles (`1m`, `5m`, `15m`, `1h`, `1D`), and heatmap snapshots.

## Environment Variables

TradeGrid uses HTTP for metadata/history and WebSocket for streaming.

- `VITE_API_BASE_URL` (optional)
  - Default: `http://localhost:4000`
  - Used by: symbol list, server status, and mock candle history hydration.

Mock WebSocket URL:
- Default is `ws://localhost:4000` in the app.
- To point Mock streaming at a different host, connect with an explicit URL (code path uses `marketClient.connect({ type: 'mock', url })`).

## Scripts

Frontend (`package.json`):
- `npm run dev`: start Vite dev server
- `npm run mock-server`: start mock server (via `server/`)
- `npm run dev:all`: run both concurrently
- `npm test`: run Vitest
- `npm run build`: TypeScript build + Vite build (see Known Issues)

Mock backend (`server/package.json`):
- `npm run start --prefix server`: start mock server with `tsx watch`
- `npm run build --prefix server`: compile server TypeScript

## Architecture (High Level)

1. Stream ingest: a Web Worker receives WS payloads and decodes/normalizes them.
2. Coalescing: events are coalesced into per-frame batches (latest candle per symbol/interval, latest heatmap, etc.).
3. State: bounded ring buffers in Zustand store trades/candles/books.
4. Render: the UI reads store slices; heavy visuals render via Canvas.

## Testing

```bash
npm test
```

There is a Playwright config in the repo. If you want to run e2e:

```bash
npx playwright test
```

## Deployment

- Mock server on Render: `render.yaml` is provided (service name `tradegrid-mock-server`).
- Frontend on Vercel (or similar): `vercel.json` includes an SPA rewrite to `index.html`.

## Troubleshooting

- If you change any files under `server/`, restart the mock server process.
- If a page throws "Maximum update depth exceeded", it is usually caused by a store selector returning a new array/object each render (e.g. `|| []`). Prefer stable shared fallbacks.

## Known Issues

- `npm run build` currently fails due to pre-existing TypeScript issues in a few non-critical pages/components. Development via `npm run dev` and `npm run dev:all` is the recommended workflow while those are being cleaned up.

