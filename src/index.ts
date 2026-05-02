import { CONFIG } from './config';
import { log } from './logger';
import { checkWebsite } from './monitor';

const intervalMs = CONFIG.POLL_INTERVAL_SECONDS * 1000;

log('info', '🚀 Datasport Crawler started');
log('info', `Monitoring: ${CONFIG.TARGET_URL}`);
log('info', `Interval: ${CONFIG.POLL_INTERVAL_SECONDS}s`);
log('info', `Status text: "${CONFIG.FULL_STATUS_TEXT}"`);

// Graceful shutdown handlers
let isShuttingDown = false;

function shutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  log('info', `${signal} received, shutting down...`);
  
  // Allow pending operations to complete
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

// Initial check
log('info', 'Running initial check...');
checkWebsite();

// Schedule recurring checks
log('info', `Scheduling checks every ${CONFIG.POLL_INTERVAL_SECONDS} seconds`);
const intervalId = setInterval(checkWebsite, intervalMs);

// Keep the process alive
setInterval(() => {
  // Heartbeat to keep process alive
}, 60000);
