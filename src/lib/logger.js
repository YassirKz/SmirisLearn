const isDebug = import.meta.env.VITE_DEBUG === 'true';

function safeFormat(arg) {
  if (arg instanceof Error) {
    return arg.stack || arg.message;
  }

  if (typeof arg === 'object') {
    try {
      return JSON.stringify(arg, null, 2);
    } catch {
      return String(arg);
    }
  }

  return String(arg);
}

function log(method, ...args) {
  const prefix = '[Smiris Learn]';
  const formatted = args.map(safeFormat);
  console[method](prefix, ...formatted);
}

const logger = {
  debug: (...args) => {
    if (!isDebug) return;
    log('debug', ...args);
  },
  info: (...args) => log('info', ...args),
  warn: (...args) => log('warn', ...args),
  error: (...args) => log('error', ...args),
};

export default logger;
