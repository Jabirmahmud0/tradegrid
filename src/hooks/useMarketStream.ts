import { useEffect, useRef, useCallback, useState } from 'react';
import { marketClient } from '../services/market-client';

const DEFAULT_SYMBOLS = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'ARB-USD', 'OP-USD'];

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
    marketClient.connectToMock();

    const subscribeTimeout = setTimeout(() => {
      marketClient.subscribe(DEFAULT_SYMBOLS);
    }, 1000);

    return () => {
      clearTimeout(subscribeTimeout);
      marketClient.unsubscribe(DEFAULT_SYMBOLS);
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
      marketClient.connect({ type: marketClient.sourceType, symbols: [activeSymbol] });
    }

    marketClient.subscribe([activeSymbol]);

    return () => {
      marketClient.unsubscribe([activeSymbol]);
    };
  }, [activeSymbol]);

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
