/**
 * High-resolution clock utility for the mock server.
 * Provides microsecond precision for deterministic simulation.
 */
export const clock = {
    now(): number {
        return Date.now();
    },
    
    hrTime(): bigint {
        return process.hrtime.bigint();
    },
    
    msSince(start: bigint): number {
        return Number(process.hrtime.bigint() - start) / 1_000_000;
    },
    
    wait(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
