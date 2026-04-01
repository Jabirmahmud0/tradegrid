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

export const Sidebar: React.FC = () => {
  const sidebarOpen = useLiveStore((state) => state.sidebarOpen);
  const toggleSidebar = useLiveStore((state) => state.toggleSidebar);
  const activeTab = useLiveStore((state) => state.activeTab);
  const setActiveTab = useLiveStore((state) => state.setActiveTab);

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Terminal', badge: null },
    { id: 'analytics', icon: BarChart3, label: 'Analytics', badge: 'Pro' },
    { id: 'replay', icon: Clock, label: 'Time Machine', badge: null },
    { id: 'data', icon: Database, label: 'Storage', badge: '92%' },
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
              <span className="text-[10px] font-mono text-green-500 font-bold">99.9%</span>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
              <div className="h-full w-[85%] bg-blue-500/50 rounded-full" />
            </div>
            {sidebarOpen && (
              <div className="flex items-center justify-between text-[8px] font-mono text-zinc-500 uppercase">
                <span>Mem: 1.2GB</span>
                <span>CPU: 14%</span>
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
