export class RingBuffer<T> {
  private buffer: T[];
  private capacity: number;
  private head: number = 0;
  private count: number = 0;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array<T>(capacity);
  }

  /**
   * Pushes a new item into the ring buffer.
   * O(1) operation. Overwrites the oldest item if at capacity.
   */
  push(item: T): void {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.capacity;
    if (this.count < this.capacity) {
      this.count++;
    }
  }

  /**
   * Pushes multiple items into the ring buffer.
   */
  pushMany(items: T[]): void {
    for (let i = 0; i < items.length; i++) {
      this.push(items[i]);
    }
  }

  /**
   * Replaces the most recently added item.
   * Useful for in-place updates (e.g. updating the current active candle).
   */
  replaceLast(item: T): void {
    if (this.count === 0) {
      this.push(item);
      return;
    }
    const idx = (this.head - 1 + this.capacity) % this.capacity;
    this.buffer[idx] = item;
  }

  /**
   * Returns all items in the buffer in chronological order (oldest to newest).
   */
  toArray(): T[] {
    const result = new Array<T>(this.count);
    let idx = (this.head - this.count + this.capacity) % this.capacity;
    for (let i = 0; i < this.count; i++) {
      result[i] = this.buffer[idx];
      idx = (idx + 1) % this.capacity;
    }
    return result;
  }

  /**
   * Returns the `n` most recently added items in chronological order.
   */
  latest(n: number): T[] {
    const amount = Math.min(n, this.count);
    const result = new Array<T>(amount);
    let idx = (this.head - amount + this.capacity) % this.capacity;
    for (let i = 0; i < amount; i++) {
      result[i] = this.buffer[idx];
      idx = (idx + 1) % this.capacity;
    }
    return result;
  }

  /**
   * Clears the buffer. Releases references to allow garbage collection.
   */
  clear(): void {
    this.head = 0;
    this.count = 0;
    this.buffer.fill(undefined as unknown as T);
  }

  /**
   * Iterates items from oldest to newest.
   */
  *[Symbol.iterator](): IterableIterator<T> {
    let idx = (this.head - this.count + this.capacity) % this.capacity;
    for (let i = 0; i < this.count; i++) {
      yield this.buffer[idx];
      idx = (idx + 1) % this.capacity;
    }
  }

  get size(): number {
    return this.count;
  }

  get length(): number {
    return this.count;
  }

  get maxCapacity(): number {
    return this.capacity;
  }
}
