import { config } from '../config.js';
const colors = {
    reset: '\x1b[0m',
    debug: '\x1b[2m',
    info: '\x1b[36m', // Cyan
    success: '\x1b[32m', // Green
    warn: '\x1b[33m', // Yellow
    error: '\x1b[31m', // Red
    dim: '\x1b[2m',
};
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
export const logger = {
    debug: (msg) => {
        if (shouldLog('debug'))
            console.log(`${colors.debug}[DEBUG]${colors.reset} ${msg}`);
    },
    info: (msg) => {
        if (shouldLog('info'))
            console.log(`${colors.info}[INFO]${colors.reset} ${msg}`);
    },
    success: (msg) => {
        if (shouldLog('info'))
            console.log(`${colors.success}[SUCCESS]${colors.reset} ${msg}`);
    },
    warn: (msg) => {
        if (shouldLog('warn'))
            console.warn(`${colors.warn}[WARN]${colors.reset} ${msg}`);
    },
    error: (msg, error) => {
        if (!shouldLog('error'))
            return;
        console.error(`${colors.error}[ERROR]${colors.reset} ${msg}`);
        if (error !== undefined)
            console.error(formatError(error));
    },
};
