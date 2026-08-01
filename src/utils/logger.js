export function logInfo(message, context = {}) {
  console.log(JSON.stringify({ level: 'info', message, ...context, timestamp: new Date().toISOString() }));
}

export function logError(message, error, context = {}) {
  console.error(JSON.stringify({
    level: 'error',
    message,
    error: error instanceof Error ? error.stack : String(error),
    ...context,
    timestamp: new Date().toISOString()
  }));
}
