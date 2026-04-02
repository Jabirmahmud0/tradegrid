/**
 * Seeded random number generator for deterministic simulations.
 * Uses a simple LCG or sfc32 based on the provided seed.
 */
export class Random {
    private a: number;
    private b: number;
    private c: number;
    private d: number;

    constructor(seed: number = 1337) {
        this.a = seed | 0;
        this.b = (seed * 0xdeadbeef) | 0;
        this.c = (seed * 0xcafebabe) | 0;
        this.d = (seed * 0x8badf00d) | 0;
    }

    // sfc32 algorithm
    next(): number {
        this.a >>>= 0; this.b >>>= 0; this.c >>>= 0; this.d >>>= 0;
        let t = (this.a + this.b | 0) + this.d | 0;
        this.d = this.d + 1 | 0;
        this.a = this.b ^ this.b >>> 9;
        this.b = (this.c + (this.c << 3)) | 0;
        this.c = (this.c << 21 | this.c >>> 11);
        this.c = this.c + t | 0;
        return (t >>> 0) / 4294967296;
    }

    between(min: number, max: number): number {
        return min + this.next() * (max - min);
    }

    int(min: number, max: number): number {
        return Math.floor(this.between(min, max));
    }

    pick<T>(arr: T[]): T {
        return arr[this.int(0, arr.length)];
    }
    
    chance(p: number): boolean {
        return this.next() < p;
    }

    gaussian(mean = 0, stdev = 1): number {
        const u = 1 - this.next(); // Turning [0,1) into (0,1]
        const v = this.next();
        const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        return z * stdev + mean;
    }
}

export const defaultRandom = new Random();
