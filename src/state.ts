import { readFileSync, writeFileSync, existsSync } from 'fs';
import { CONFIG } from './config';
import { log } from './logger';

export interface MonitorState {
  lastHash: string | null;
  lastStatus: string;
  lastCheck: string | null;
  consecutiveBlocks: number;
  consecutiveErrors: number;
}

const defaultState: MonitorState = {
  lastHash: null,
  lastStatus: 'unknown',
  lastCheck: null,
  consecutiveBlocks: 0,
  consecutiveErrors: 0,
};

export function loadState(): MonitorState {
  try {
    if (existsSync(CONFIG.STATE_FILE)) {
      const raw = readFileSync(CONFIG.STATE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      log('debug', 'State loaded from file');
      return { ...defaultState, ...parsed };
    }
  } catch (error) {
    log('warn', 'Failed to load state file, using defaults', error);
  }
  return { ...defaultState };
}

export function saveState(state: MonitorState) {
  try {
    writeFileSync(CONFIG.STATE_FILE, JSON.stringify(state, null, 2));
    log('debug', 'State saved to file');
  } catch (error) {
    log('error', 'Failed to save state file', error);
  }
}
