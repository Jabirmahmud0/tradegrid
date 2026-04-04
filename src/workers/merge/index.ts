import { StreamEvent, NormalizedCandle, BookDeltaEvent } from '../../types/stream.types';

export function coalesceEvents(events: StreamEvent[]): StreamEvent[] {
  const finalEvents: StreamEvent[] = [];
  
  const latestCandlePerSymbol = new Map<string, NormalizedCandle>();
  const latestBookPerSymbol = new Map<string, BookDeltaEvent>();
  let latestHeatmap: any = null;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    if (event.t === 'trade') {
      finalEvents.push(event);
    } else if (event.t === 'candle') {
      const key = `${event.sym}-${event.interval}`;
      latestCandlePerSymbol.set(key, event as NormalizedCandle);
    } else if (event.t === 'book') {
      latestBookPerSymbol.set(event.sym, event as BookDeltaEvent);
    } else if (event.t === 'heatmap') {
      latestHeatmap = event;
    } else {
      // Fallback for any other event types
      finalEvents.push(event);
    }
  }

  for (const candle of latestCandlePerSymbol.values()) {
    finalEvents.push(candle);
  }
  for (const book of latestBookPerSymbol.values()) {
    finalEvents.push(book);
  }
  if (latestHeatmap) {
    finalEvents.push(latestHeatmap);
  }

  return finalEvents;
}
