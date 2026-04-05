import { useEffect, useRef, useCallback, useState } from 'react';
import { marketClient } from '../services/market-client';
import { useLiveStore } from '../store/live-store';
import { buildStreamSymbols, DEFAULT_STREAM_SYMBOLS } from '../lib/market-symbols';
import { fetchBinanceCandles } from '../services/binance-market-data';
import { fetchMockCandles } from '../services/mock-market-data';

export interface MarketStreamControls {
  connectToBinance: () => void;
  connectToBinanceTestnet: () => void;
  connectToMock: () => void;
  disconnect: () => void;
  sourceType: string;
  isConnected: boolean;
}

/**
 * Single hook that manages both the WebSocket connection lifecycle
 * and symbol subscriptions. Replaces the old useMarketData + useMarketStream pair.
 *
 * On mount: connects to current source type, subscribes to default symbol set.
 * On symbol change: updates subscription without tearing down the connection.
 * On unmount: unsubscribes and disconnects.
 */
export function useMarketStream(activeSymbol: string): MarketStreamControls {
  const symbolRef = useRef(activeSymbol);
  const [sourceType, setSourceType] = useState(marketClient.sourceType);
  const [isConnected, setIsConnected] = useState(marketClient.connected);
  const activeInterval = useLiveStore((state) => state.activeInterval);
  const dataSource = useLiveStore((state) => state.dataSource);
  const setCandles = useLiveStore((state) => state.setCandles);

  // Keep sourceType / isConnected fresh via polling (lightweight, no event bus needed)
  useEffect(() => {
    const id = setInterval(() => {
      setSourceType(marketClient.sourceType);
      setIsConnected(marketClient.connected);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Initial connection + default symbol subscription
  useEffect(() => {
    const initialSource = useLiveStore.getState().dataSource;

    if (initialSource.startsWith('binance')) {
      marketClient.connect({
        type: initialSource,
        symbols: buildStreamSymbols(activeSymbol),
        interval: activeInterval,
        focusSymbol: activeSymbol,
      });
    } else {
      marketClient.connect({ type: 'mock', symbols: [...DEFAULT_STREAM_SYMBOLS] });
    }

    return () => {
      if (marketClient.sourceType === 'mock') {
        marketClient.unsubscribe([...DEFAULT_STREAM_SYMBOLS]);
      }
      marketClient.disconnect();
    };
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Active symbol subscription — reacts to activeSymbol changes
  useEffect(() => {
    symbolRef.current = activeSymbol;

    if (!marketClient.connected) return;

    // For binance sources, reconnect with new symbol list
    if (marketClient.sourceType.startsWith('binance')) {
      marketClient.connect({
        type: marketClient.sourceType,
        symbols: buildStreamSymbols(activeSymbol),
        interval: activeInterval,
        focusSymbol: activeSymbol,
      });
    }

    if (marketClient.sourceType === 'mock') {
      marketClient.subscribe([activeSymbol]);
    }

    return () => {
      if (marketClient.sourceType === 'mock') {
        marketClient.unsubscribe([activeSymbol]);
      }
    };
  }, [activeInterval, activeSymbol]);

  useEffect(() => {
    const controller = new AbortController();
    const hydrate = async () => {
      if (dataSource === 'binance' || dataSource === 'binance-testnet') {
        return fetchBinanceCandles(dataSource, activeSymbol, activeInterval, 300, controller.signal);
      }

      if (dataSource === 'mock') {
        return fetchMockCandles(activeSymbol, activeInterval, controller.signal);
      }

      return [];
    };

    hydrate()
      .then((candles) => {
        if (candles.length > 0) {
          setCandles(activeSymbol, activeInterval, candles);
        }
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error('[useMarketStream] Failed to hydrate candles:', error);
      });

    return () => controller.abort();
  }, [activeInterval, activeSymbol, dataSource, setCandles]);

  // Stable control functions
  const connectToBinance = useCallback(() => marketClient.connectToBinance(), []);
  const connectToBinanceTestnet = useCallback(() => marketClient.connectToBinanceTestnet(), []);
  const connectToMock = useCallback(() => marketClient.connectToMock(), []);
  const disconnect = useCallback(() => marketClient.disconnect(), []);

  return {
    connectToBinance,
    connectToBinanceTestnet,
    connectToMock,
    disconnect,
    sourceType,
    isConnected,
  };
}
