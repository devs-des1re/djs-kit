import { config } from '../config.js';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const colors = {
    reset: '\x1b[0m',
    debug: '\x1b[2m',
    info: '\x1b[36m', // Cyan
    success: '\x1b[32m', // Green
    warn: '\x1b[33m', // Yellow
    error: '\x1b[31m', // Red
    dim: '\x1b[2m',
};
const logStartedAt = new Date();
const logFileName = `bot-${logStartedAt.toISOString().replace(/[:.]/g, '-')}-${process.pid}.log`;
export const logFilePath = join(process.cwd(), 'logs', logFileName);
function writeLogHeader() {
    try {
        mkdirSync(join(process.cwd(), 'logs'), { recursive: true });
        writeFileSync(logFilePath, `djs-kit log started at ${logStartedAt.toISOString()}\nprocess ${process.pid}\n\n`);
    }
    catch {
        // Console logging still works if the host filesystem is read-only.
    }
}
writeLogHeader();
const levelPriority = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
};
function shouldLog(level) {
    return levelPriority[level] >= levelPriority[config.logLevel];
}
function formatError(error) {
    if (error instanceof Error)
        return error.stack ?? error.message;
    return String(error);
}
function stripAnsi(value) {
    return value.replace(/\x1b\[[0-9;]*m/g, '');
}
function writeToFile(level, msg, error) {
    try {
        const lines = [`[${new Date().toISOString()}] [${level.toUpperCase()}] ${stripAnsi(msg)}`];
        if (error !== undefined)
            lines.push(formatError(error));
        appendFileSync(logFilePath, `${lines.join('\n')}\n`);
    }
    catch {
        // Avoid recursive logger failures.
    }
}
export const logger = {
    debug: (msg) => {
        if (!shouldLog('debug'))
            return;
        console.log(`${colors.debug}[DEBUG]${colors.reset} ${msg}`);
        writeToFile('debug', msg);
    },
    info: (msg) => {
        if (!shouldLog('info'))
            return;
        console.log(`${colors.info}[INFO]${colors.reset} ${msg}`);
        writeToFile('info', msg);
    },
    success: (msg) => {
        if (!shouldLog('info'))
            return;
        console.log(`${colors.success}[SUCCESS]${colors.reset} ${msg}`);
        writeToFile('success', msg);
    },
    warn: (msg) => {
        if (!shouldLog('warn'))
            return;
        console.warn(`${colors.warn}[WARN]${colors.reset} ${msg}`);
        writeToFile('warn', msg);
    },
    error: (msg, error) => {
        if (!shouldLog('error'))
            return;
        console.error(`${colors.error}[ERROR]${colors.reset} ${msg}`);
        if (error !== undefined)
            console.error(formatError(error));
        writeToFile('error', msg, error);
    },
};
