const log = (type, msg, ...args) => {
  const time = new Date().toISOString();
  console[type](`[${time}] ${msg}`, ...args);
};

module.exports = {
  info: (msg, ...a) => log('log', `[INFO] ${msg}`, ...a),
  warn: (msg, ...a) => log('warn', `[WARNING] ${msg}`, ...a),
  error: (msg, ...a) => log('error', `[ERROR] ${msg}`, ...a),
  success: (msg, ...a) => log('log', `[SUCCESS] ${msg}`, ...a)
};