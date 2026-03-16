const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  ACCESS: 'ACCESS'
};

function formatLog(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    service: 'social-app',
    ...meta
  };
  return JSON.stringify(logEntry);
}

export const logger = {
  debug: (message, meta) => console.log(formatLog(LOG_LEVELS.DEBUG, message, meta)),
  info: (message, meta) => console.log(formatLog(LOG_LEVELS.INFO, message, meta)),
  warn: (message, meta) => console.warn(formatLog(LOG_LEVELS.WARN, message, meta)),
  error: (message, meta) => console.error(formatLog(LOG_LEVELS.ERROR, message, meta)),
  access: (message, meta) => console.log(formatLog(LOG_LEVELS.ACCESS, message, meta))
};

export function logRequest(req, status, duration, meta = {}) {
  const logData = {
    method: req.method,
    path: req.url || req.nextUrl?.pathname,
    status,
    duration_ms: duration,
    userAgent: req.headers?.get?.('user-agent') || 'unknown',
    ...meta
  };

  if (status >= 500) {
    logger.error('Request failed', logData);
  } else if (status >= 400) {
    logger.warn('Request error', logData);
  } else {
    logger.access('Request completed', logData);
  }
}

export default logger;
