import { useQuery } from '@tanstack/react-query';

export interface SymbolMetadata {
  symbol: string;
  name: string;
  sector: string;
  baseAsset: string;
  quoteAsset: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export function useSymbols() {
  return useQuery<SymbolMetadata[]>({
    queryKey: ['symbols'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/symbols`);
      if (!res.ok) throw new Error(`Failed to fetch symbols: ${res.statusText}`);
      return res.json();
    },
    staleTime: 5 * 60_000, // 5 minutes — symbol metadata rarely changes
  });
}

export function useSymbol(symbol: string) {
  return useQuery<SymbolMetadata>({
    queryKey: ['symbols', symbol],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/symbols`);
      if (!res.ok) throw new Error(`Failed to fetch symbols: ${res.statusText}`);
      const all: SymbolMetadata[] = await res.json();
      const found = all.find(s => s.symbol === symbol);
      if (!found) throw new Error(`Symbol ${symbol} not found`);
      return found;
    },
    enabled: !!symbol,
    staleTime: 5 * 60_000,
  });
}

export function useServerStatus() {
  return useQuery<{
    status: string;
    uptime: number;
    clients: number;
    bufferSize: number;
    currentScenario: string;
  }>({
    queryKey: ['server-status'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/status`);
      if (!res.ok) throw new Error(`Failed to fetch server status: ${res.statusText}`);
      return res.json();
    },
    refetchInterval: 10_000, // Poll every 10s
    staleTime: 5_000,
    retry: 3,
  });
}

export function useSymbolHistory(symbol: string, limit = 500) {
  return useQuery<any[]>({
    queryKey: ['history', symbol, limit],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/history/${symbol}`);
      if (!res.ok) throw new Error(`Failed to fetch history for ${symbol}: ${res.statusText}`);
      return res.json();
    },
    enabled: !!symbol,
    staleTime: 30_000,
  });
}
