import React from 'react';
import { useLiveStore } from '../../store/live-store';
import { cn } from '../../utils';
import { Gauge, Cpu, Zap } from 'lucide-react';

export const DebugPanel: React.FC<{ className?: string }> = ({ className }) => {
  const metrics = useLiveStore(state => state.metrics);

  const getFPSColor = (fps: number) => {
    if (fps >= 55) return 'text-emerald-400';
    if (fps >= 30) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className={cn(
        "flex items-center gap-4 bg-zinc-900/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-zinc-800/50 shadow-sm",
        className
    )}>
      {/* FPS Gauge */}
      <div className="flex items-center gap-1.5 border-r border-zinc-800 pr-3">
        <Gauge size={12} className="text-zinc-500" />
        <span className={cn("text-[10px] font-mono font-bold tracking-tight", getFPSColor(metrics.fps))}>
          {metrics.fps} <span className="text-zinc-600 font-normal opacity-50 uppercase text-[8px]">fps</span>
        </span>
      </div>

      {/* EPS (Events Per Second) */}
      <div className="flex items-center gap-1.5 border-r border-zinc-800 pr-3">
        <Cpu size={12} className="text-zinc-500" />
        <span className="text-[10px] font-mono font-bold text-zinc-300">
          {metrics.eventsPerSec.toLocaleString()} <span className="text-zinc-600 font-normal opacity-50 uppercase text-[8px]">eps</span>
        </span>
      </div>

      {/* Latency (RTT) */}
      <div className="flex items-center gap-1.5 pr-1">
        <Zap size={11} className="text-zinc-500" />
        <span className="text-[10px] font-mono font-bold text-zinc-400">
          {metrics.dispatchLatency} <span className="text-zinc-600 font-normal opacity-50 uppercase text-[8px]">ms</span>
        </span>
      </div>
    </div>
  );
};
