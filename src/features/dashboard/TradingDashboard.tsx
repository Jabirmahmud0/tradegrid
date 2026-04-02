import * as React from 'react';
import { Card } from '../../components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { useMarketStream } from '../../hooks/useMarketStream';
import { useMarketData } from '../../hooks/useMarketData';
import { useLiveStore } from '../../store/live-store';
import { CandlestickChart } from '../charts/candlestick/CandlestickChart';
import { TradeTape } from '../trades/TradeTape';
import { OrderBook } from '../orderbook/OrderBook';
import { MarketHeatmap } from '../heatmap/MarketHeatmap';
import { DepthChart } from '../orderbook/DepthChart';
import { SymbolSelector } from './SymbolSelector';
import { ReplayControls } from '../replay/ReplayControls';
import { ReplayPanel } from '../replay/ReplayPanel';
import { DebugPanel } from '../debug/DebugPanel';
import { marketClient } from '../../services/market-client';
import { cn } from '../../utils';

const EMPTY_CANDLES: any[] = [];

export const TradingDashboard: React.FC = () => {
  const [activeSymbol, setActiveSymbol] = React.useState('BTC-USD');
  const [activeTab, setActiveTab] = React.useState('heatmap');

  const { mode, status, setReplayStatus, speed } = useLiveStore();
  
  useMarketData();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          if (mode === 'REPLAY') {
            const nextStatus = status === 'PLAYING' ? 'PAUSED' : 'PLAYING';
            setReplayStatus(nextStatus);
            if (nextStatus === 'PLAYING') marketClient.startReplay(speed);
            else marketClient.stopReplay();
          }
          break;
        case 'h': setActiveTab('heatmap'); break;
        case 'd': setActiveTab('depth'); break;
        case 'i': setActiveTab('history'); break;
        case 'e': setActiveTab('executions'); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, status, speed, setReplayStatus]);
  
  useMarketStream(activeSymbol);

  const candles = useLiveStore(state => state.candles[`${activeSymbol}-1m`] || EMPTY_CANDLES);
  const latestCandle = candles[candles.length - 1]; 
  
  const price = latestCandle?.c.toLocaleString(undefined, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }) || '---';

  const priceColor = latestCandle?.isUp ? 'text-[var(--color-profit)]' : 'text-[var(--color-loss)]';

  return (
    <div className="h-screen w-screen p-1 flex flex-col bg-[var(--color-bg-base)] text-[var(--color-text-primary)]">
      {/* Top Header / Symbol Ticker */}
      <header className="h-12 border-b border-[var(--color-border)] flex items-center px-4 gap-6 shrink-0 bg-[var(--color-bg-base)]">
          <div className="flex items-center gap-2">
              <span className="font-bold text-lg">{activeSymbol}</span>
              <span className="text-[var(--color-text-tertiary)] text-xs uppercase">Perpetual</span>
          </div>

          <div className="flex gap-6 items-center border-l border-[var(--color-border-subtle)] pl-6">
              <div className="flex flex-col">
                  <span className={cn("text-lg font-bold font-mono tracking-tight", priceColor)}>{price}</span>
                  <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono">Mark Price: {price}</span>
              </div>
              <div className="flex flex-col">
                  <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-bold">24h Change</span>
                  <span className={cn("text-[11px] font-mono", priceColor)}>+1.24%</span>
              </div>
              <div className="flex flex-col">
                  <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-bold">24h High</span>
                  <span className="text-[11px] font-mono">98,012.44</span>
              </div>
              <div className="flex flex-col">
                  <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-bold">24h Low</span>
                  <span className="text-[11px] font-mono">96,442.21</span>
              </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
              <DebugPanel />
              <SymbolSelector activeSymbol={activeSymbol} onSelect={setActiveSymbol} />
          </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden grid grid-cols-12 gap-1.5 p-1.5">
          {/* Main Chart Area */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-1.5 overflow-hidden">
              <Card variant="outline" className="flex-1 shadow-none border-[var(--color-border)]">
                 <CandlestickChart candles={candles} />
              </Card>

              {/* Bottom Panels (Heatmap / Depth / History) */}
              <div className="h-1/3 min-h-[220px]">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                  <TabsList className="bg-[var(--color-bg-base)] border-b border-[var(--color-border)] rounded-none h-9 px-2 gap-2 flex items-center justify-start shrink-0">
                    <TabsTrigger value="heatmap" className="data-[state=active]:bg-[var(--color-bg-surface)] text-[9px] uppercase tracking-wider font-bold h-7 px-3">Liquidity Heatmap [H]</TabsTrigger>
                    <TabsTrigger value="depth" className="data-[state=active]:bg-[var(--color-bg-surface)] text-[9px] uppercase tracking-wider font-bold h-7 px-3">Depth Map [D]</TabsTrigger>
                    <TabsTrigger value="history" className="data-[state=active]:bg-[var(--color-bg-surface)] text-[9px] uppercase tracking-wider font-bold h-7 px-3">Trade History [I]</TabsTrigger>
                    <TabsTrigger value="executions" className="data-[state=active]:bg-[var(--color-bg-surface)] text-[9px] uppercase tracking-wider font-bold h-7 px-3">Executions [E]</TabsTrigger>
                  </TabsList>
                  <div className="flex-1 bg-[var(--color-bg-base)] border-x border-b border-[var(--color-border)] overflow-hidden">
                    <TabsContent value="heatmap" className="h-full m-0 p-0 overflow-hidden">
                       <MarketHeatmap />
                    </TabsContent>
                    <TabsContent value="depth" className="h-full m-0 p-0 overflow-hidden">
                       <DepthChart symbol={activeSymbol} />
                    </TabsContent>
                    <TabsContent value="history" className="h-full m-0 p-4 text-[var(--color-text-tertiary)] text-[10px] font-mono">
                      Market order history coming soon...
                    </TabsContent>
                    <TabsContent value="executions" className="h-full m-0 p-4 text-[var(--color-text-tertiary)] text-[10px] font-mono">
                      No active executions detected.
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
          </div>

          {/* Right Sidebar - Order Book & Trade Tape */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-1.5 overflow-hidden">
              <Card 
                  variant="outline" 
                  header="Order Book"
                  className="flex-1 border-[var(--color-border)] shadow-none"
              >
                  <OrderBook symbol={activeSymbol} />
              </Card>
              <Card 
                  variant="outline" 
                  header="Recent Trades"
                  className="h-1/3 min-h-[250px] border-[var(--color-border)] shadow-none"
              >
                  <TradeTape symbol={activeSymbol} />
              </Card>
          </div>
      </div>

      {/* Floating Replay Controls */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-2 rounded-full bg-[var(--color-bg-overlay)] border border-[var(--color-border-strong)]/30 shadow-2xl backdrop-blur-xl">
        <ReplayControls />
      </div>
      <ReplayPanel />
    </div>
  );
};
