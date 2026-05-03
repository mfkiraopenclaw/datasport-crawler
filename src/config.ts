import dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env from project root
dotenv.config({ path: resolve(__dirname, '../.env') });

export const CONFIG = {
  // Target URL to monitor
  TARGET_URL: process.env.TARGET_URL || 'https://www.datasport.de/anmeldeservice/509/3081/11285',

  // Polling interval in seconds (default: 2 minutes — was 5s, don't be a DDoS bot)
  POLL_INTERVAL_SECONDS: parseInt(process.env.POLL_INTERVAL_SECONDS || '120', 10),

  // Jitter: random variance added to interval (0.0–1.0, e.g. 0.2 = ±20%)
  JITTER_FACTOR: parseFloat(process.env.JITTER_FACTOR || '0.25'),

  // Telegram notifications
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '',

  // Email notifications (optional)
  EMAIL_NOTIFICATIONS: process.env.EMAIL_NOTIFICATIONS === 'true',
  EMAIL_TO: process.env.EMAIL_TO || '',
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // State file for persistent hash storage
  STATE_FILE: process.env.STATE_FILE || resolve(__dirname, '../.last-hash'),

  // Retry & backoff
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES || '3', 10),
  BASE_RETRY_DELAY_MS: parseInt(process.env.BASE_RETRY_DELAY_MS || '5000', 10),

  // Slow-response threshold (ms) — above this = possible throttling
  BLOCK_THRESHOLD_MS: parseInt(process.env.BLOCK_THRESHOLD_MS || '10000', 10),

  // Notification cooldown: minimum seconds between repeated BLOCKED alerts
  NOTIFICATION_COOLDOWN_SECONDS: parseInt(process.env.NOTIFICATION_COOLDOWN_SECONDS || '3600', 10),

  // Status text to monitor for (German locale)
  FULL_STATUS_TEXT: 'aktuell kein Platz verfügbar',
  OPEN_INDICATORS: [
    'Startplatz buchen',
    'Jetzt anmelden',
    'Anmeldung',
    'freie Startplätze',
    'verfügbar'
  ],

  // Rotating User-Agent pool (pick one per request)
  USER_AGENTS: [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0',
  ]
};

// Validate required config
if (!CONFIG.TELEGRAM_BOT_TOKEN) {
  console.warn('⚠️  TELEGRAM_BOT_TOKEN not set — Telegram notifications will be disabled');
}
if (!CONFIG.TELEGRAM_CHAT_ID) {
  console.warn('⚠️  TELEGRAM_CHAT_ID not set — Telegram notifications will be disabled');
}
