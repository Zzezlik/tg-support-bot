// Рівні: error < warn < info < debug.
const LEVEL_PRIORITY = Object.freeze({
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
});

let currentLevel = 'info';

export function setLogLevel(level) {
  if (Object.hasOwn(LEVEL_PRIORITY, level)) {
    currentLevel = level;
  }
}

function shouldLog(level) {
  return LEVEL_PRIORITY[level] <= LEVEL_PRIORITY[currentLevel];
}

function emit(level, message, meta) {
  if (!shouldLog(level)) {
    return;
  }

  const line = `${new Date().toISOString()} [${level.toUpperCase()}] ${message}`;
  const sink = level === 'error' || level === 'warn' ? console.error : console.log;

  if (meta === undefined) {
    sink(line);
  } else {
    sink(line, meta);
  }
}

export const logger = {
  error: (message, meta) => emit('error', message, meta),
  warn: (message, meta) => emit('warn', message, meta),
  info: (message, meta) => emit('info', message, meta),
  debug: (message, meta) => emit('debug', message, meta),
};
