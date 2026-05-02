import { CONFIG } from './config';

export function log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any) {
  const timestamp = new Date().toLocaleString('de-DE', {
    timeZone: 'Europe/Berlin',
  });
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

  const levels: Record<string, number> = { debug: 0, info: 1, warn: 2, error: 3 };
  const configLevel = levels[CONFIG.LOG_LEVEL] ?? 1;

  if (levels[level] >= configLevel) {
    if (data) {
      console.log(prefix, message, data);
    } else {
      console.log(prefix, message);
    }
  }
}
