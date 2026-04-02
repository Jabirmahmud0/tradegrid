# TradeGrid — High-Frequency Market Terminal

TradeGrid is an institutional-grade visualization engine built for low-latency market data analysis. It leverages modern web technologies to deliver 60fps performance while processing over 50,000 events per second (EPS).

## 📊 Core Performance Specs
- **Throughput:** 50k+ Events/Sec (Burst)
- **Framerate:** 60fps Steady (rAF Optimized)
- **Serialization:** MessagePack (Binary) ↔ Web Workers
- **Ingestion:** Sub-millisecond worker decoupling

---

## 🏗️ Architecture Overview

TradeGrid separates the data acquisition thread from the UI rendering thread to prevent blocking during intense market volatility.

```mermaid
graph TD
    A[Mock Server] -- Binary (msgpack) --> B[Web Worker]
    B -- Decoding & Normalization --> C[Inbound Queue]
    C -- Coalescing (16ms) --> D[RootStore (Zustand)]
    D -- Reactive Selector --> E[Canvas 2D Rendering]
    D -- State Slice --> F[Virtual Tape Display]
    
    subgraph "Main Thread (~60fps)"
        E
        F
    end
```

### Key Components
- **Market Heatmap (Canvas):** High-performance treemap visualization of liquidity clusters.
- **Historical Replay:** 5,000-event historical buffer with multi-speed playback (1x–10x).
- **Depth Map:** Cumulative liquidity walls with real-time delta updates.
- **Performance Monitor:** Live FPS, EPS, and RTT (Latency) tracking.

---

## 🚀 Getting Started

### Local Development
1. **Bootstrap:**
   ```bash
   npm install
   ```

2. **Launch System:**
   ```bash
   npm run dev:all
   ```
   *This starts both the Vite frontend and the Node.js mock backend in parallel.*

## 🧪 Testing Suite
- **Unit (Vitest):** Event normalization and ring-buffer retention.
- **E2E (Playwright):** UI state transitions and keyboard-first navigation.
- **Manual Perf:** Chrome DevTools memory profiling for drift detection.

---

## 🛠️ Elite Tech Stack
- **Frontend:** React 19 + TypeScript (Strict)
- **State:** Zustand (Slices + Static Selectors)
- **Styling:** Tailwind CSS v4 + Glassmorphism + JetBrains Mono
- **Visualization:** HTML5 Canvas API
- **Binary Pipeline:** @msgpack/msgpack + Comlink (Web Worker)
- **Icons:** Lucide-React

---

**Developed with precision for high-performance trading environments.**
