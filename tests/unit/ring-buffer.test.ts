import { describe, it, expect } from 'vitest';
import { RingBuffer } from '../../src/lib/ring-buffer';

describe('RingBuffer', () => {
  it('should push and retrieve elements', () => {
    const rb = new RingBuffer<number>(3);
    rb.push(1);
    rb.push(2);
    expect(rb.toArray()).toEqual([1, 2]);
  });

  it('should overwrite oldest elements when full', () => {
    const rb = new RingBuffer<number>(3);
    rb.push(1);
    rb.push(2);
    rb.push(3);
    rb.push(4); // Overwrites 1
    expect(rb.toArray()).toEqual([2, 3, 4]);
  });

  it('should return latest n elements', () => {
    const rb = new RingBuffer<number>(5);
    [1, 2, 3, 4, 5, 6].forEach(n => rb.push(n));
    expect(rb.latest(3)).toEqual([4, 5, 6]);
  });

  it('should be iterable', () => {
    const rb = new RingBuffer<number>(3);
    rb.push(1);
    rb.push(2);
    const result = [];
    for (const item of rb) {
        result.push(item);
    }
    expect(result).toEqual([1, 2]);
  });

  it('should clear successfully', () => {
    const rb = new RingBuffer<number>(3);
    rb.push(1);
    rb.clear();
    expect(rb.length).toBe(0);
    expect(rb.toArray()).toEqual([]);
  });
});
