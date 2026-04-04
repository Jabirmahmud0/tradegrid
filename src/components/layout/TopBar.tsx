import * as React from 'react';
import { Activity, Bell, ChevronDown, Cpu, Globe, Search, Wifi, WifiOff, Check } from 'lucide-react';
import { useLiveStore } from '../../store/live-store';
import { Price } from '../common/Price';
import { Badge } from '../common/Badge';
import { StatusIndicator } from '../common/StatusIndicator';
import { Button } from '../ui/Button';
import { marketClient, DataSourceType } from '../../services/market-client';
import { cn } from '../../utils';

export const TopBar: React.FC = () => {
  const activeSymbol = useLiveStore((state) => state.activeSymbol);
  const activeInterval = useLiveStore((state) => state.activeInterval);
  const systemReady = useLiveStore((state) => state.systemReady);
  const metrics = useLiveStore((state) => state.metrics);
  const stats = useLiveStore((state) => state.stats[activeSymbol]);
  
  const [symbolDropdownOpen, setSymbolDropdownOpen] = React.useState(false);
  const [intervalDropdownOpen, setIntervalDropdownOpen] = React.useState(false);
  const [dataSourceOpen, setDataSourceOpen] = React.useState(false);
  const [currentSource, setCurrentSource] = React.useState<DataSourceType>('mock');
  
  // Real system cores
  const cores = React.useMemo(() => typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4, []);

  const symbols = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'ARB-USD', 'OP-USD', 'AVAX-USD', 'ADA-USD', 'MATIC-USD', 'LINK-USD'];
  const intervals = ['1m', '5m', '15m', '1h', '1D'];

  const setActiveSymbol = useLiveStore((state) => state.setActiveSymbol);
  const setActiveInterval = useLiveStore((state) => state.setActiveInterval);

  // Sync with marketClient state
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSource(marketClient.sourceType);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const dataSources: { type: DataSourceType; label: string; description: string }[] = [
    { type: 'mock', label: 'Mock Server', description: 'Local simulated data' },
    { type: 'binance-testnet', label: 'Binance Testnet', description: 'Real-time testnet data' },
    { type: 'binance', label: 'Binance Mainnet', description: 'Live market data' },
  ];

  const handleSelectSource = (type: DataSourceType) => {
    setDataSourceOpen(false);
    
    switch (type) {
      case 'mock':
        marketClient.connectToMock();
        break;
      case 'binance-testnet':
        marketClient.connectToBinanceTestnet([activeSymbol]);
        break;
      case 'binance':
        marketClient.connectToBinance([activeSymbol]);
        break;
    }
    
    // Force re-render to update UI
    setCurrentSource(type);
  };

  return (
    <header className="h-12 border-b border-zinc-900 bg-zinc-950 flex items-center px-4 gap-6 shrink-0 relative z-10">
      {/* Symbol Selector */}
      <div className="relative flex items-center gap-2 pr-4 border-r border-zinc-900 h-8">
        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-500 font-bold uppercase leading-none mb-0.5">Symbol</span>
          <div 
            className="flex items-center gap-1.5 cursor-pointer hover:bg-zinc-900 px-1.5 py-0.5 -ml-1.5 rounded-sm transition-colors"
            onClick={() => { setSymbolDropdownOpen(!symbolDropdownOpen); setIntervalDropdownOpen(false); setDataSourceOpen(false); }}
          >
            <span className="text-sm font-black tracking-tight text-zinc-100">{activeSymbol}</span>
            <ChevronDown className="w-3 h-3 text-zinc-500" />
          </div>
        </div>
        {symbolDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setSymbolDropdownOpen(false)} />
              <div className="absolute left-0 top-10 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl z-50 overflow-hidden py-2">
                 {symbols.map(s => (
                   <div 
                      key={s} 
                      className={cn("px-4 py-2 text-sm font-bold cursor-pointer hover:bg-zinc-800", activeSymbol === s ? "text-emerald-400" : "text-zinc-300")}
                      onClick={() => { setActiveSymbol(s); setSymbolDropdownOpen(false); }}
                   >
                     {s}
                   </div>
                 ))}
              </div>
            </>
        )}
      </div>

      {/* Interval Selector */}
      <div className="relative flex items-center gap-2 pr-4 border-r border-zinc-900 h-8">
        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-500 font-bold uppercase leading-none mb-0.5">Interval</span>
          <div 
             className="flex items-center gap-1.5 cursor-pointer hover:bg-zinc-900 px-1.5 py-0.5 -ml-1.5 rounded-sm transition-colors"
             onClick={() => { setIntervalDropdownOpen(!intervalDropdownOpen); setSymbolDropdownOpen(false); setDataSourceOpen(false); }}
          >
            <span className="text-xs font-bold text-zinc-300">{activeInterval}</span>
            <ChevronDown className="w-3 h-3 text-zinc-500" />
          </div>
        </div>
        {intervalDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIntervalDropdownOpen(false)} />
              <div className="absolute left-0 top-10 w-24 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl z-50 overflow-hidden py-2">
                 {intervals.map(i => (
                   <div 
                      key={i} 
                      className={cn("px-4 py-2 text-xs font-bold cursor-pointer hover:bg-zinc-800", activeInterval === i as any ? "text-emerald-400" : "text-zinc-300")}
                      onClick={() => { setActiveInterval(i as any); setIntervalDropdownOpen(false); }}
                   >
                     {i}
                   </div>
                 ))}
              </div>
            </>
        )}
      </div>

      {/* Real-time Price */}
      <div className="flex items-center gap-4 flex-1">
        {stats ? (
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <Price value={stats.price} prevValue={stats.prevPrice} size="lg" />
              <div className="flex items-center gap-2 -mt-0.5">
                <Price value={stats.changePercent24h} showSign size="sm" className="font-bold" />
                <span className="text-[10px] text-zinc-500 font-bold uppercase">Vol {stats.volume24h > 1000000 ? (stats.volume24h/1000000).toFixed(1) + 'M' : stats.volume24h.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-zinc-500 italic">Waiting for market data...</div>
        )}
      </div>

      {/* System Status & Meta */}
      <div className="flex items-center gap-5">
        <div className="hidden lg:flex items-center gap-4 border-r border-zinc-900 pr-5 h-8">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-zinc-600 font-bold uppercase leading-none mb-1">Latency</span>
            <div className={cn("flex items-center gap-1 text-[10px] font-mono", metrics?.dispatchLatency < 50 ? "text-green-500" : metrics?.dispatchLatency < 200 ? "text-yellow-500" : "text-red-500")}>
              <Activity className="w-2.5 h-2.5" />
              <span>{systemReady ? (metrics?.dispatchLatency || 0).toFixed(0) : '--'}ms</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-zinc-600 font-bold uppercase leading-none mb-1">Cores</span>
            <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400">
              <Cpu className="w-2.5 h-2.5" />
              <span>1/{cores}</span>
            </div>
          </div>
        </div>

        {/* Data Source Selector */}
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => { setDataSourceOpen(!dataSourceOpen); setSymbolDropdownOpen(false); setIntervalDropdownOpen(false); }}
          >
            {currentSource === 'mock' ? (
              <WifiOff className="w-4 h-4 text-zinc-500" />
            ) : (
              <Wifi className="w-4 h-4 text-emerald-500" />
            )}
          </Button>
          
          {dataSourceOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setDataSourceOpen(false)}
              />
              <div className="absolute right-0 top-10 w-64 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl z-50 overflow-hidden">
                <div className="p-3 border-b border-zinc-800">
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Data Source</h3>
                </div>
                <div className="p-2">
                  {dataSources.map((source) => (
                    <button
                      key={source.type}
                      onClick={() => handleSelectSource(source.type)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-zinc-800 transition-colors group"
                    >
                      <div className={`w-2 h-2 rounded-full ${
                        currentSource === source.type 
                          ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' 
                          : 'bg-zinc-700'
                      }`} />
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-200">{source.label}</span>
                          {currentSource === source.type && (
                            <Check className="w-3 h-3 text-emerald-500" />
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-500">{source.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="p-3 bg-zinc-950/50 border-t border-zinc-800">
                  <p className="text-[10px] text-zinc-500">
                    {currentSource === 'mock' 
                      ? 'Using simulated market data' 
                      : 'Connected to live data stream'}
                  </p>
                </div>
              </div>
            </>
          )}
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
