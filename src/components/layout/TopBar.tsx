import * as React from 'react';
import { Activity, Bell, ChevronDown, Cpu, Globe, Search } from 'lucide-react';
import { useLiveStore } from '../../store/live-store';
import { Price } from '../common/Price';
import { Badge } from '../common/Badge';
import { StatusIndicator } from '../common/StatusIndicator';
import { Button } from '../ui/Button';

export const TopBar: React.FC = () => {
  const activeSymbol = useLiveStore((state) => state.activeSymbol);
  const activeInterval = useLiveStore((state) => state.activeInterval);
  const systemReady = useLiveStore((state) => state.systemReady);

  return (
    <header className="h-12 border-b border-zinc-900 bg-zinc-950 flex items-center px-4 gap-6 shrink-0 relative z-10">
      {/* Symbol Selector */}
      <div className="flex items-center gap-2 pr-4 border-r border-zinc-900 h-8">
        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-500 font-bold uppercase leading-none mb-0.5">Symbol</span>
          <div className="flex items-center gap-1.5 cursor-pointer hover:bg-zinc-900 px-1.5 py-0.5 -ml-1.5 rounded-sm transition-colors">
            <span className="text-sm font-black tracking-tight text-zinc-100">{activeSymbol}</span>
            <ChevronDown className="w-3 h-3 text-zinc-500" />
          </div>
        </div>
      </div>

      {/* Interval Selector */}
      <div className="flex items-center gap-2 pr-4 border-r border-zinc-900 h-8">
        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-500 font-bold uppercase leading-none mb-0.5">Interval</span>
          <div className="flex items-center gap-1.5 cursor-pointer hover:bg-zinc-900 px-1.5 py-0.5 -ml-1.5 rounded-sm transition-colors">
            <span className="text-xs font-bold text-zinc-300">{activeInterval}</span>
            <ChevronDown className="w-3 h-3 text-zinc-500" />
          </div>
        </div>
      </div>

      {/* Real-time Price */}
      <div className="flex items-center gap-4 flex-1">
        <div className="flex flex-col">
          <Price value={97432.54} prevValue={97421.12} size="lg" />
          <div className="flex items-center gap-2 -mt-0.5">
            <Price value={1.24} showSign size="sm" className="font-bold" />
            <span className="text-[10px] text-zinc-500 font-bold uppercase text-blue-500/80">Vol 1.2B</span>
          </div>
        </div>
      </div>

      {/* System Status & Meta */}
      <div className="flex items-center gap-5">
        <div className="hidden lg:flex items-center gap-4 border-r border-zinc-900 pr-5 h-8">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-zinc-600 font-bold uppercase leading-none mb-1">Latency</span>
            <div className="flex items-center gap-1 text-[10px] font-mono text-green-500">
              <Activity className="w-2.5 h-2.5" />
              <span>12ms</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-zinc-600 font-bold uppercase leading-none mb-1">Cores</span>
            <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400">
              <Cpu className="w-2.5 h-2.5" />
              <span>8/12</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusIndicator status={systemReady ? 'online' : 'syncing'} />
          <Badge variant="live" size="sm">Live</Badge>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Search className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 h-1.5 w-1.5 bg-blue-500 rounded-full" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Globe className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
