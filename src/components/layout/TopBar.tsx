import * as React from 'react';
import { Activity, Bell, ChevronDown, Cpu, Globe, Search, Wifi, WifiOff, Check } from 'lucide-react';
import { useLiveStore } from '../../store/live-store';
import { Price } from '../common/Price';
import { Badge } from '../common/Badge';
import { StatusIndicator } from '../common/StatusIndicator';
import { Button } from '../ui/Button';
import { marketClient } from '../../services/market-client';
import { useSymbols, useServerStatus } from '../../services/market-data.queries';
import { buildStreamSymbols } from '../../lib/market-symbols';
import { cn } from '../../utils';

const EMPTY_CANDLES: readonly never[] = [];

export const TopBar: React.FC = () => {
  const activeSymbol = useLiveStore((state) => state.activeSymbol);
  const activeInterval = useLiveStore((state) => state.activeInterval);
  const systemReady = useLiveStore((state) => state.systemReady);
  const metrics = useLiveStore((state) => state.metrics);
  const stats = useLiveStore((state) => state.stats[activeSymbol]);
  const activeCandles = useLiveStore((state) => state.candles[`${activeSymbol}-${activeInterval}`] || EMPTY_CANDLES);
  const trades = useLiveStore((state) => state.trades);
  const dataSource = useLiveStore((state) => state.dataSource);

  // HTTP-fetched metadata via TanStack Query (not streaming state)
  const { data: symbolsMeta } = useSymbols();
  const { data: serverStatus } = useServerStatus();

  const [symbolDropdownOpen, setSymbolDropdownOpen] = React.useState(false);
  const [intervalDropdownOpen, setIntervalDropdownOpen] = React.useState(false);
  const [dataSourceDropdownOpen, setDataSourceDropdownOpen] = React.useState(false);

  // Estimated active processing units
  const cores = React.useMemo(() => typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4, []);
  const activeProcessingUnits = React.useMemo(() => {
    let units = 1;
    if (systemReady || metrics.workerDecodeTime > 0) units += 1;
    return Math.min(cores, units);
  }, [cores, metrics.workerDecodeTime, systemReady]);

  // Fallback symbols if HTTP fetch hasn't completed
  const FALLBACK_SYMBOLS = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'ARB-USD', 'OP-USD', 'AVAX-USD', 'ADA-USD', 'MATIC-USD', 'LINK-USD'];
  const symbolList = symbolsMeta?.map(s => s.symbol) ?? FALLBACK_SYMBOLS;
  const intervals = ['1m', '5m', '15m', '1h', '1D'];

  const setActiveSymbol = useLiveStore((state) => state.setActiveSymbol);
  const setActiveInterval = useLiveStore((state) => state.setActiveInterval);

  const dataSources: { type: 'mock' | 'binance' | 'binance-testnet'; label: string; description: string }[] = [
    { type: 'mock', label: 'Mock Server', description: 'Local simulated data' },
    { type: 'binance-testnet', label: 'Binance Testnet', description: 'Real-time testnet data' },
    { type: 'binance', label: 'Binance Mainnet', description: 'Live market data' },
  ];
  const activeDataSource = dataSources.find((source) => source.type === dataSource);

  const derivedStats = React.useMemo(() => {
    const latestCandle = activeCandles[activeCandles.length - 1];
    const prevCandle = activeCandles[activeCandles.length - 2];
    const latestTrade = trades.find((trade) => trade.sym === activeSymbol);

    if (!latestCandle && !latestTrade) return null;

    const price = latestCandle?.c ?? latestTrade?.px ?? 0;
    const prevPrice = prevCandle?.c ?? latestCandle?.o ?? latestTrade?.px ?? price;
    const visibleWindow = activeCandles.slice(-Math.min(activeCandles.length, 144));
    const high24h = visibleWindow.length > 0 ? Math.max(...visibleWindow.map((candle) => candle.h)) : price;
    const low24h = visibleWindow.length > 0 ? Math.min(...visibleWindow.map((candle) => candle.l)) : price;
    const volume24h = visibleWindow.reduce((sum, candle) => sum + candle.v, 0);
    const change24h = price - prevPrice;
    const changePercent24h = prevPrice > 0 ? (change24h / prevPrice) * 100 : 0;

    return {
      price,
      prevPrice,
      change24h,
      changePercent24h,
      high24h,
      low24h,
      volume24h,
    };
  }, [activeCandles, activeSymbol, trades]);

  const displayStats = stats ?? derivedStats;

  const handleSelectSource = (type: 'mock' | 'binance' | 'binance-testnet') => {
    setDataSourceDropdownOpen(false);

    switch (type) {
      case 'mock':
        marketClient.connect({ type: 'mock', symbols: [activeSymbol] });
        break;
      case 'binance-testnet':
        marketClient.connect({
          type: 'binance-testnet',
          symbols: buildStreamSymbols(activeSymbol),
          interval: activeInterval,
          focusSymbol: activeSymbol,
        });
        break;
      case 'binance':
        marketClient.connect({
          type: 'binance',
          symbols: buildStreamSymbols(activeSymbol),
          interval: activeInterval,
          focusSymbol: activeSymbol,
        });
        break;
    }

    // DO NOT call setDataSource() here — marketClient will update the store
    // AFTER the connection is confirmed (on CONNECTED message).
    // If the connection fails, marketClient will revert to the previous source.
  };

  return (
    <header className="h-12 border-b border-zinc-900 bg-zinc-950 flex items-center px-4 gap-6 shrink-0 relative z-40" role="banner">
      {/* Symbol Selector */}
      <div className="relative flex items-center gap-2 pr-4 border-r border-zinc-900 h-8">
        <div className="flex flex-col">
          <span id="symbol-label" className="text-[10px] text-zinc-500 font-bold uppercase leading-none mb-0.5">Symbol</span>
          <button
            type="button"
            role="combobox"
            aria-expanded={symbolDropdownOpen}
            aria-haspopup="listbox"
            aria-controls="symbol-listbox"
            aria-labelledby="symbol-label"
            className="flex items-center gap-1.5 cursor-pointer hover:bg-zinc-900 px-1.5 py-0.5 -ml-1.5 rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            onClick={() => { setSymbolDropdownOpen(!symbolDropdownOpen); setIntervalDropdownOpen(false); setDataSourceDropdownOpen(false); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSymbolDropdownOpen(!symbolDropdownOpen); }
              if (e.key === 'Escape') setSymbolDropdownOpen(false);
            }}
          >
            <span className="text-sm font-black tracking-tight text-zinc-100">{activeSymbol}</span>
            <ChevronDown className="w-3 h-3 text-zinc-500" aria-hidden />
          </button>
        </div>
        {symbolDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setSymbolDropdownOpen(false)} />
              <div
                id="symbol-listbox"
                role="listbox"
                aria-label="Select trading symbol"
                className="absolute left-0 top-10 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl z-50 overflow-hidden py-2"
              >
                 {symbolList.map(s => (
                   <div
                      key={s}
                      role="option"
                      aria-selected={activeSymbol === s}
                      tabIndex={0}
                      className={cn("px-4 py-2 text-sm font-bold cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]", activeSymbol === s ? "text-emerald-400" : "text-zinc-300")}
                      onClick={() => { setActiveSymbol(s); setSymbolDropdownOpen(false); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { setActiveSymbol(s); setSymbolDropdownOpen(false); } }}
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
          <span id="interval-label" className="text-[10px] text-zinc-500 font-bold uppercase leading-none mb-0.5">Interval</span>
          <button
            type="button"
            role="combobox"
            aria-expanded={intervalDropdownOpen}
            aria-haspopup="listbox"
            aria-controls="interval-listbox"
            aria-labelledby="interval-label"
            className="flex items-center gap-1.5 cursor-pointer hover:bg-zinc-900 px-1.5 py-0.5 -ml-1.5 rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            onClick={() => { setIntervalDropdownOpen(!intervalDropdownOpen); setSymbolDropdownOpen(false); setDataSourceDropdownOpen(false); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIntervalDropdownOpen(!intervalDropdownOpen); }
              if (e.key === 'Escape') setIntervalDropdownOpen(false);
            }}
          >
            <span className="text-xs font-bold text-zinc-300">{activeInterval}</span>
            <ChevronDown className="w-3 h-3 text-zinc-500" aria-hidden />
          </button>
        </div>
        {intervalDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIntervalDropdownOpen(false)} />
              <div
                id="interval-listbox"
                role="listbox"
                aria-label="Select candle interval"
                className="absolute left-0 top-10 w-24 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl z-50 overflow-hidden py-2"
              >
                 {intervals.map(i => (
                   <div
                      key={i}
                      role="option"
                      aria-selected={activeInterval === i}
                      tabIndex={0}
                      className={cn("px-4 py-2 text-xs font-bold cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]", activeInterval === i as any ? "text-emerald-400" : "text-zinc-300")}
                      onClick={() => { setActiveInterval(i as any); setIntervalDropdownOpen(false); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { setActiveInterval(i as any); setIntervalDropdownOpen(false); } }}
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
        {displayStats ? (
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <Price value={displayStats.price} prevValue={displayStats.prevPrice} size="lg" />
              <div className="flex items-center gap-2 -mt-0.5">
                <Price value={displayStats.changePercent24h} showSign size="sm" className="font-bold" />
                <span className="text-[10px] text-zinc-500 font-bold uppercase">Vol {displayStats.volume24h > 1000000 ? (displayStats.volume24h/1000000).toFixed(1) + 'M' : displayStats.volume24h.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
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
              <span>{activeProcessingUnits}/{cores}</span>
            </div>
          </div>
        </div>

        {/* Data Source Selector */}
        <div className="relative z-[70] flex items-center gap-2">
          <div className="hidden xl:flex flex-col items-end min-w-[120px]">
            <span className="text-[10px] text-zinc-600 font-bold uppercase leading-none mb-1">Data Source</span>
            <span className="text-[11px] font-semibold text-zinc-300 truncate max-w-[120px]">
              {activeDataSource?.label ?? 'Unknown'}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => { setDataSourceDropdownOpen(!dataSourceDropdownOpen); setSymbolDropdownOpen(false); setIntervalDropdownOpen(false); }}
          >
            {dataSource === 'mock' ? (
              <WifiOff className="w-4 h-4 text-zinc-500" />
            ) : (
              <Wifi className="w-4 h-4 text-emerald-500" />
            )}
          </Button>

          {dataSourceDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDataSourceDropdownOpen(false)}
              />
              <div className="absolute right-0 top-10 w-64 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl z-[90] overflow-hidden">
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
                        dataSource === source.type
                          ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                          : 'bg-zinc-700'
                      }`} />
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-200">{source.label}</span>
                          {dataSource === source.type && (
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
                    {dataSource === 'mock'
                      ? `Using simulated market data${serverStatus ? ` — ${serverStatus.clients} client(s), ${serverStatus.bufferSize} buffered` : ''}`
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
