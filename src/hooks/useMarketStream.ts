import { useEffect } from 'react';
import { marketClient } from '../services/market-client';

/**
 * Hook to manage market data subscriptions for one or more symbols
 * Handles automatic sub/unsub on mount/unmount and symbol changes
 */
export function useMarketStream(symbols: string | string[]) {
  const symbolList = Array.isArray(symbols) ? symbols : [symbols];

  useEffect(() => {
    // Connect if not already (safely handled by client)
    marketClient.connect();

    // Subscribe to symbols
    marketClient.subscribe(symbolList);

    // Unsubscribe on cleanup
    return () => {
      marketClient.unsubscribe(symbolList);
    };
  }, [JSON.stringify(symbolList)]); // Re-run if symbols array contents change
}
