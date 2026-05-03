import { CONFIG } from './config';
import { log } from './logger';
import { checkWebsite, getNextIntervalMs } from './monitor';

log('info', '🚀 Datasport Crawler started');
log('info', `Monitoring: ${CONFIG.TARGET_URL}`);
log('info', `Base interval: ${CONFIG.POLL_INTERVAL_SECONDS}s, jitter: ${CONFIG.JITTER_FACTOR * 100}%`);
log('info', `Status text: "${CONFIG.FULL_STATUS_TEXT}"`);

// Graceful shutdown handlers
let isShuttingDown = false;

function shutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  log('info', `${signal} received, shutting down...`);

  setTimeout(() => {
    process.exit(0);
  }, 1000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log('error', 'Uncaught exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log('error', 'Unhandled rejection', reason);
});

// Run check with dynamic jittered interval
async function runLoop() {
  await checkWebsite();
  const nextMs = getNextIntervalMs();
  log('debug', `Next check in ${(nextMs / 1000).toFixed(1)}s`);
  setTimeout(runLoop, nextMs);
}

// Initial check
log('info', 'Running initial check...');
runLoop();

// Keep the process alive
setInterval(() => {
  // Heartbeat to keep process alive
}, 60000);
