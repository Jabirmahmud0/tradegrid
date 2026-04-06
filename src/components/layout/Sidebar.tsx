import * as React from 'react';
import {
  BarChart3,
  Clock,
  Database,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Zap,
  Menu,
  ChevronLeft
} from 'lucide-react';
import { useLiveStore } from '../../store/live-store';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { useServerStatus } from '../../services/market-data.queries';
import { RETENTION_POLICIES } from '../../lib/retention';

export const Sidebar: React.FC = () => {
  const sidebarOpen = useLiveStore((state) => state.sidebarOpen);
  const toggleSidebar = useLiveStore((state) => state.toggleSidebar);
  const activeTab = useLiveStore((state) => state.activeTab);
  const setActiveTab = useLiveStore((state) => state.setActiveTab);
  const metrics = useLiveStore((state) => state.metrics);
  const trades = useLiveStore((state) => state.trades);
  const candles = useLiveStore((state) => state.candles);
  const books = useLiveStore((state) => state.books);
  const eventLog = useLiveStore((state) => state.eventLog);
  const heatmap = useLiveStore((state) => state.heatmap);
  const { data: serverStatus } = useServerStatus();

  const totalCandles = Object.values(candles).reduce((sum, ring) => sum + ring.length, 0);
  const candleCapacity = Object.entries(candles).reduce((sum, [key]) => {
    return sum + (key.includes('1m') ? RETENTION_POLICIES.CANDLES.MIN_1 : RETENTION_POLICIES.CANDLES.HOUR_1_PLUS);
  }, 0);
  const storageCapacity =
    RETENTION_POLICIES.TRADES +
    candleCapacity +
    100 +
    RETENTION_POLICIES.HEATMAP +
    RETENTION_POLICIES.DEBUG_LOG;
  const storageUsed = trades.length + totalCandles + Object.keys(books).length + (heatmap ? 1 : 0) + eventLog.length;
  const storageUtilization = storageCapacity > 0 ? Math.min(100, Math.round((storageUsed / storageCapacity) * 100)) : 0;
  const engineHealth = serverStatus?.status === 'UP' ? 'ONLINE' : 'OFFLINE';
  const memoryMb = metrics.memoryEstimate > 0 ? metrics.memoryEstimate / 1024 : storageUsed * 0.1;
  const cpuPercent = Math.min(100, Math.max(0, Math.round((metrics.workerDecodeTime + metrics.renderLatency) * 4)));

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Terminal', badge: null },
    { id: 'analytics', icon: BarChart3, label: 'Analytics', badge: null },
    { id: 'replay', icon: Clock, label: 'Time Machine', badge: null },
    { id: 'data', icon: Database, label: 'Storage', badge: `${storageUtilization}%` },
    { id: 'status', icon: ShieldCheck, label: 'Security', badge: null },
  ] as const;

  return (
    <aside 
      className={cn(
        "h-full border-r border-zinc-900 bg-zinc-950 flex flex-col transition-all duration-300 ease-in-out relative z-20",
        sidebarOpen ? "w-64" : "w-14"
      )}
    >
      {/* Brand / Toggle */}
      <div className="h-12 flex items-center px-3 border-b border-zinc-900">
        <div className={cn("flex items-center gap-3 overflow-hidden transition-all", sidebarOpen ? "w-full" : "w-0 opacity-0")}>
          <div className="h-6 w-6 bg-blue-600 rounded-sm flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <span className="text-sm font-black tracking-tighter text-zinc-100 whitespace-nowrap">TRADEGRID</span>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className="shrink-0"
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 flex flex-col gap-1 px-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "flex items-center gap-3 px-2 py-2 rounded-sm transition-all relative group",
              activeTab === item.id 
                ? "bg-blue-600/10 text-blue-400 font-bold" 
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
            )}
          >
            <item.icon className={cn("w-5 h-5 shrink-0", activeTab === item.id ? "text-blue-500" : "text-zinc-600 group-hover:text-zinc-400")} />
            {sidebarOpen && (
              <div className="flex items-center justify-between flex-1 overflow-hidden">
                <span className="text-xs truncate">{item.label}</span>
                {item.badge && (
                  <span className="text-[8px] bg-zinc-800 text-zinc-400 px-1 rounded-sm border border-zinc-700">
                    {item.badge}
                  </span>
                )}
              </div>
            )}
            {activeTab === item.id && (
              <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-blue-500 rounded-r-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            )}
          </button>
        ))}
      </nav>

      {/* Footer System Health */}
      <div className="p-2 border-t border-zinc-900">
        <div className={cn("flex flex-col gap-3 p-2 bg-black/40 rounded-sm border border-zinc-900/50 hover:border-zinc-800 transition-colors cursor-pointer", !sidebarOpen && "items-center px-0")}>
          {sidebarOpen && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Engine</span>
              <span className={cn(
                'text-[10px] font-mono font-bold',
                engineHealth === 'ONLINE' ? 'text-green-500' : 'text-red-500'
              )}>
                {engineHealth}
              </span>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500/50 rounded-full" style={{ width: `${Math.max(8, storageUtilization)}%` }} />
            </div>
            {sidebarOpen && (
              <div className="flex items-center justify-between text-[8px] font-mono text-zinc-500 uppercase">
                <span>Mem: {memoryMb >= 1024 ? `${(memoryMb / 1024).toFixed(1)}GB` : `${memoryMb.toFixed(0)}MB`}</span>
                <span>CPU: {cpuPercent}%</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-2 flex flex-col gap-1">
          <Button variant="ghost" size="icon" className="w-full justify-start px-2 gap-3 text-zinc-500 h-9">
            <Settings className="w-4 h-4 shrink-0" />
            {sidebarOpen && <span className="text-xs">Settings</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
};
