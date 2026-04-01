import * as React from 'react';
import { Card } from '../../components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { useMarketStream } from '../../hooks/useMarketStream';
import { useLiveStore } from '../../store/live-store';
import { CandleChart } from '../charts/CandleChart';
import { TradeTape } from '../trades/TradeTape';
import { OrderBook } from '../orderbook/OrderBook';
import { MarketHeatmap } from '../heatmap/MarketHeatmap';
import { DepthChart } from '../orderbook/DepthChart';

export const TradingDashboard: React.FC = () => {
  // Subscribe to default symbols
  useMarketStream(['BTC-USD', 'ETH-USD']);

  // Get latest data from store
  const btcCandles = useLiveStore(state => state.candles['BTC-USD-1m'] || []);
  const latestCandle = btcCandles[0]; 
  
  const btcPrice = latestCandle?.c.toLocaleString(undefined, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }) || '---';

  const priceColor = latestCandle?.isUp ? 'text-green-500' : 'text-red-500';

  return (
    <div className="h-full w-full p-1 lg:p-2 grid grid-cols-12 grid-rows-12 gap-1 lg:gap-2 bg-zinc-950 text-zinc-100">
      {/* Main Chart Area */}
      <Card 
        variant="outline" 
        header={
          <div className="flex items-center gap-4">
            <span className="text-zinc-100 font-bold text-sm lg:text-base">BTC-USD <span className="text-zinc-500 font-normal ml-1">Perpetual</span></span>
            <div className="flex items-center gap-2 border-l border-zinc-800 pl-4">
              <span className={`font-mono font-bold ${priceColor}`}>{btcPrice}</span>
              <span className="text-zinc-600 font-normal text-[10px]">Index: {btcPrice}</span>
            </div>
          </div>
        }
        className="col-span-12 lg:col-span-8 row-span-7 lg:row-span-8 overflow-hidden"
      >
        <div className="h-full w-full bg-zinc-900/5">
          <CandleChart candles={btcCandles} />
        </div>
      </Card>

      {/* Order Book */}
      <Card 
        variant="outline" 
        header="Order Book"
        className="col-span-12 lg:col-span-2 row-span-6 lg:row-span-12 overflow-hidden"
      >
        <OrderBook symbol="BTC-USD" />
      </Card>

      {/* Recent Trades (Tape) */}
      <Card 
        variant="outline" 
        header="Recent Trades"
        className="col-span-12 lg:col-span-2 row-span-6 lg:row-span-12 overflow-hidden"
      >
        <TradeTape symbol="BTC-USD" />
      </Card>

      {/* Bottom Panels (Heatmap / Depth / History / Info) */}
      <div className="col-span-12 lg:col-span-8 row-span-5 lg:row-span-4">
        <Tabs defaultValue="heatmap" className="h-full flex flex-col">
          <TabsList className="bg-zinc-900/50 border-b border-zinc-800 rounded-none h-10 px-2 gap-2 flex items-center justify-start">
            <TabsTrigger value="heatmap" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-[10px] uppercase tracking-wider font-bold h-7">Liquidity Heatmap</TabsTrigger>
            <TabsTrigger value="depth" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-[10px] uppercase tracking-wider font-bold h-7">Depth Map</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-[10px] uppercase tracking-wider font-bold h-7">Trade History</TabsTrigger>
            <TabsTrigger value="executions" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100 text-[10px] uppercase tracking-wider font-bold h-7">My Executions</TabsTrigger>
          </TabsList>
          <div className="flex-1 bg-zinc-950 border-x border-b border-zinc-900 rounded-b-sm overflow-hidden">
            <TabsContent value="heatmap" className="h-full m-0 p-0 overflow-hidden">
               <MarketHeatmap />
            </TabsContent>
            <TabsContent value="depth" className="h-full m-0 p-0 overflow-hidden">
               <DepthChart symbol="BTC-USD" />
            </TabsContent>
            <TabsContent value="history" className="h-full m-0 p-4 text-zinc-500 text-xs">
              Transaction logging...
            </TabsContent>
            <TabsContent value="executions" className="h-full m-0 p-4 text-zinc-500 text-xs">
              No recent executions.
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};
