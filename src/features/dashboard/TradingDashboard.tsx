import * as React from 'react';
import { Card } from '../../components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { useMarketStream } from '../../hooks/useMarketStream';
import { useLiveStore } from '../../store/live-store';
import { CandlestickChart } from '../charts/candlestick/CandlestickChart';
import { TradeTape } from '../trades/TradeTape';
import { OrderBook } from '../orderbook/OrderBook';
import { MarketHeatmap } from '../heatmap/MarketHeatmap';
import { DepthChart } from '../orderbook/DepthChart';
import { HistoryTab } from '../history/HistoryTab';
import { ExecutionsTab } from '../executions/ExecutionsTab';
import { ReplayControls } from '../replay/ReplayControls';
import { ReplayPanel } from '../replay/ReplayPanel';
import { marketClient } from '../../services/market-client';

const EMPTY_CANDLES: any[] = [];

export const TradingDashboard: React.FC = () => {
  const activeSymbol = useLiveStore(state => state.activeSymbol);
  const activeInterval = useLiveStore(state => state.activeInterval);
  const [activeTab, setActiveTab] = React.useState('heatmap');

  const { mode, status, setReplayStatus, speed } = useLiveStore();

  // Single hook: manages connection + subscriptions
  useMarketStream(activeSymbol);

  // Keyboard shortcuts
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

  const candles = useLiveStore(state => state.candles[`${activeSymbol}-${activeInterval}`] || EMPTY_CANDLES);

  return (
    <div className="h-screen w-screen p-1 flex flex-col bg-[var(--color-bg-base)] text-[var(--color-text-primary)]">
      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden grid grid-cols-12 gap-1.5 p-1.5">
          {/* Main Chart Area */}
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-1.5 overflow-hidden">
              <Card variant="outline" className="flex-1 shadow-none border-[var(--color-border)]">
                 <CandlestickChart candles={candles} />
              </Card>

              {/* Bottom Panels (Heatmap / Depth / History / Executions) */}
              <div className="h-1/3 min-h-[220px]">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                  <TabsList className="flex items-center h-8 shrink-0 bg-[var(--color-bg-surface)] border-b border-[var(--color-border)]">
                    <TabsTrigger value="heatmap" className="h-full px-4 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] border-b-2 border-transparent hover:text-[var(--color-text-secondary)] transition-all duration-200 ease-in-out data-[state=active]:text-[var(--color-accent)] data-[state=active]:border-[var(--color-accent)]">
                      Liquidity Heatmap <span className="ml-1 opacity-50">[H]</span>
                    </TabsTrigger>
                    <TabsTrigger value="depth" className="h-full px-4 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] border-b-2 border-transparent hover:text-[var(--color-text-secondary)] transition-all duration-200 ease-in-out data-[state=active]:text-[var(--color-accent)] data-[state=active]:border-[var(--color-accent)]">
                      Depth Map <span className="ml-1 opacity-50">[D]</span>
                    </TabsTrigger>
                    <TabsTrigger value="history" className="h-full px-4 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] border-b-2 border-transparent hover:text-[var(--color-text-secondary)] transition-all duration-200 ease-in-out data-[state=active]:text-[var(--color-accent)] data-[state=active]:border-[var(--color-accent)]">
                      Trade History <span className="ml-1 opacity-50">[I]</span>
                    </TabsTrigger>
                    <TabsTrigger value="executions" className="h-full px-4 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] border-b-2 border-transparent hover:text-[var(--color-text-secondary)] transition-all duration-200 ease-in-out data-[state=active]:text-[var(--color-accent)] data-[state=active]:border-[var(--color-accent)]">
                      Executions <span className="ml-1 opacity-50">[E]</span>
                    </TabsTrigger>
                  </TabsList>
                  <div className="flex-1 border border-[var(--color-border)] border-t-0 overflow-hidden">
                    <TabsContent value="heatmap" className="h-full m-0 p-0 overflow-hidden">
                       <MarketHeatmap />
                    </TabsContent>
                    <TabsContent value="depth" className="h-full m-0 p-0 overflow-hidden">
                       <DepthChart symbol={activeSymbol} />
                    </TabsContent>
                    <TabsContent value="history" className="h-full m-0 p-0 overflow-hidden">
                      <HistoryTab />
                    </TabsContent>
                    <TabsContent value="executions" className="h-full m-0 p-0 overflow-hidden">
                      <ExecutionsTab />
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
