import * as React from 'react';
import { Card } from '../../components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';

export const TradingDashboard: React.FC = () => {
  return (
    <div className="h-full w-full p-1 lg:p-2 grid grid-cols-12 grid-rows-12 gap-1 lg:gap-2 bg-zinc-950">
      {/* Main Chart Area */}
      <Card 
        variant="outline" 
        header={
          <div className="flex items-center gap-4">
            <span className="text-zinc-100">BTC-USD <span className="text-zinc-500 font-normal">Perpetual</span></span>
            <div className="flex items-center gap-2 border-l border-zinc-800 pl-4">
              <span className="text-green-500">97,432.50</span>
              <span className="text-zinc-600 font-normal">Index: 97,431.10</span>
            </div>
          </div>
        }
        className="col-span-12 lg:col-span-8 row-span-7 lg:row-span-8"
      >
        <div className="h-full w-full bg-zinc-900/5 flex items-center justify-center text-zinc-800 font-mono italic">
          [Main Chart Engine Slot]
        </div>
      </Card>

      {/* Order Book */}
      <Card 
        variant="outline" 
        header="Order Book"
        className="col-span-12 lg:col-span-2 row-span-6 lg:row-span-12"
      >
        <div className="h-full w-full flex flex-col p-2 gap-4">
          <div className="flex-1 bg-zinc-900/10 rounded-sm border border-dashed border-zinc-900 flex items-center justify-center text-[10px] text-zinc-700">
            [Asks]
          </div>
          <div className="h-6 flex items-center justify-center border-y border-zinc-900 text-xs font-bold text-zinc-400">
            97,432.50
          </div>
          <div className="flex-1 bg-zinc-900/10 rounded-sm border border-dashed border-zinc-900 flex items-center justify-center text-[10px] text-zinc-700">
            [Bids]
          </div>
        </div>
      </Card>

      {/* Recent Trades (Tape) */}
      <Card 
        variant="outline" 
        header="Recent Trades"
        className="col-span-12 lg:col-span-2 row-span-6 lg:row-span-12"
      >
        <div className="h-full w-full bg-zinc-900/10 flex items-center justify-center text-[10px] text-zinc-700 font-mono uppercase tracking-tighter">
          [Live Tape Slot]
        </div>
      </Card>

      {/* Bottom Panels (Heatmap / History / Info) */}
      <div className="col-span-12 lg:col-span-8 row-span-5 lg:row-span-4">
        <Tabs defaultValue="heatmap" className="h-full flex flex-col">
          <TabsList>
            <TabsTrigger value="heatmap">Liquidity Heatmap</TabsTrigger>
            <TabsTrigger value="history">Trade History</TabsTrigger>
            <TabsTrigger value="executions">My Executions</TabsTrigger>
            <TabsTrigger value="funding">Funding Rate</TabsTrigger>
          </TabsList>
          <div className="flex-1 bg-zinc-950 border border-t-0 border-zinc-900 rounded-b-sm overflow-hidden">
            <TabsContent value="heatmap" className="h-full">
              <div className="h-full flex items-center justify-center text-zinc-800 italic font-mono">
                [Depth Heatmap Engine Slot]
              </div>
            </TabsContent>
            <TabsContent value="history" className="h-full p-4 text-zinc-500">
              Transaction logging...
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};
