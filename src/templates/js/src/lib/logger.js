const colors = {
    reset: '\x1b[0m',
    info: '\x1b[36m', // Cyan
    success: '\x1b[32m', // Green
    warn: '\x1b[33m', // Yellow
    error: '\x1b[31m', // Red
    dim: '\x1b[2m',
};
export const logger = {
    info: (msg) => console.log(`${colors.info}[INFO]${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.success}[SUCCESS]${colors.reset} ${msg}`),
    warn: (msg) => console.warn(`${colors.warn}[WARN]${colors.reset} ${msg}`),
    error: (msg) => console.error(`${colors.error}[ERROR]${colors.reset} ${msg}`),
};
