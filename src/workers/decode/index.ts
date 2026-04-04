import { decode } from '@msgpack/msgpack';

export function decodePayload(data: ArrayBuffer | string, sourceType: 'mock' | 'binance' | 'custom'): any | null {
  if (sourceType === 'binance' || !(data instanceof ArrayBuffer)) {
    try {
      return typeof data === 'string' ? JSON.parse(data) : JSON.parse(new TextDecoder().decode(data));
    } catch (e) {
      console.warn('[Worker] JSON parse error:', e);
      return null;
    }
  } else if (data instanceof ArrayBuffer) {
    try {
      return decode(data);
    } catch (err) {
      console.error('[Worker] Decode error:', err);
      return null;
    }
  }
  return null;
}
