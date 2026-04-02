/**
 * Structured logger for mock-server.
 */
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

export class Logger {
    private level: LogLevel;
    private name: string;

    constructor(name: string, level: LogLevel = LogLevel.INFO) {
        this.name = name;
        this.level = level;
    }

    private log(level: LogLevel, ...args: any[]) {
        if (level < this.level) return;
        
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${LogLevel[level]}] [${this.name}]`;
        
        switch (level) {
            case LogLevel.DEBUG: console.debug(prefix, ...args); break;
            case LogLevel.INFO: console.info(prefix, ...args); break;
            case LogLevel.WARN: console.warn(prefix, ...args); break;
            case LogLevel.ERROR: console.error(prefix, ...args); break;
        }
    }

    debug(...args: any[]) { this.log(LogLevel.DEBUG, ...args); }
    info(...args: any[]) { this.log(LogLevel.INFO, ...args); }
    warn(...args: any[]) { this.log(LogLevel.WARN, ...args); }
    error(...args: any[]) { this.log(LogLevel.ERROR, ...args); }
}

export const serverLogger = new Logger('Server');
