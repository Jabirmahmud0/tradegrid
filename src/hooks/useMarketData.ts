import { useEffect } from 'react';
import { marketClient } from '../services/market-client';

/**
 * Hook to initialize and manage market data connection
 * Automatically connects to mock server on mount
 */
export function useMarketData() {
  useEffect(() => {
    // Connect to mock server by default
    marketClient.connectToMock();

    // Subscribe to symbols after a delay to ensure connection is established
    // The mock server needs the subscription before it sends trades/candles/books
    const subscribeTimeout = setTimeout(() => {
      marketClient.subscribe(['BTC-USD', 'ETH-USD', 'SOL-USD', 'ARB-USD', 'OP-USD']);
    }, 1000);

    // Cleanup on unmount
    return () => {
      clearTimeout(subscribeTimeout);
      marketClient.disconnect();
    };
  }, []);

  return {
    connectToBinance: () => marketClient.connectToBinance(),
    connectToBinanceTestnet: () => marketClient.connectToBinanceTestnet(),
    connectToMock: () => marketClient.connectToMock(),
    disconnect: () => marketClient.disconnect(),
    sourceType: marketClient.sourceType,
    isConnected: marketClient.connected,
  };
}
