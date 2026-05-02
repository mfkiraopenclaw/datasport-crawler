import { createHash } from 'crypto';
import { CONFIG } from './config';
import { log } from './logger';
import { loadState, saveState, MonitorState } from './state';
import { notifyStatusChange } from './notifier';

// Global state (loaded once, updated in-memory)
let state: MonitorState = loadState();

function computeHash(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function extractStatusText(html: string): { status: string; isFull: boolean; isOpen: boolean } {
  // Look for the specific "no places available" text
  const hasNoPlaces = html.includes(CONFIG.FULL_STATUS_TEXT);
  
  // Check for open indicators
  const hasOpenIndicators = CONFIG.OPEN_INDICATORS.some(indicator => 
    html.toLowerCase().includes(indicator.toLowerCase())
  );
  
  // Check participant count / free spots
  const freeSpotsMatch = html.match(/freie Startplätze.*?<span[^>]*>(\d+)<\/span>/i);
  const freeSpots = freeSpotsMatch ? parseInt(freeSpotsMatch[1], 10) : null;
  
  if (hasNoPlaces || (freeSpots !== null && freeSpots === 0)) {
    return { status: 'FULL', isFull: true, isOpen: false };
  }
  
  if (hasOpenIndicators || (freeSpots !== null && freeSpots > 0)) {
    return { status: 'OPEN', isFull: false, isOpen: true };
  }
  
  // Fallback: check the specific HTML structure
  const bookingMatch = html.match(/<span class="ym-button">(.*?)<\/span>/);
  if (bookingMatch) {
    const buttonText = bookingMatch[1].toLowerCase();
    if (buttonText.includes('weiter') || buttonText.includes('buchen')) {
      return { status: 'OPEN', isFull: false, isOpen: true };
    }
  }
  
  return { status: 'UNKNOWN', isFull: false, isOpen: false };
}

async function fetchWithRetry(url: string, retries = 0): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.BLOCK_THRESHOLD_MS);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': CONFIG.USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (retries < CONFIG.MAX_RETRIES) {
      log('warn', `Request failed, retrying in ${CONFIG.RETRY_DELAY_MS}ms (attempt ${retries + 1}/${CONFIG.MAX_RETRIES})`);
      await sleep(CONFIG.RETRY_DELAY_MS);
      return fetchWithRetry(url, retries + 1);
    }
    
    throw error;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function checkWebsite(): Promise<void> {
  const startTime = Date.now();
  
  try {
    log('debug', `Checking ${CONFIG.TARGET_URL}`);
    
    const response = await fetchWithRetry(CONFIG.TARGET_URL);
    const responseTime = Date.now() - startTime;
    
    // Check if we got a valid response
    if (!response.ok) {
      log('warn', `HTTP ${response.status} from target`);
      state.consecutiveErrors++;
      
      if (state.consecutiveErrors >= 3) {
        log('error', `Multiple consecutive errors (${state.consecutiveErrors}), possible block`);
        await notifyStatusChange(
          CONFIG.TARGET_URL,
          state.lastStatus,
          `HTTP ${response.status}`,
          true
        );
        state.consecutiveBlocks++;
      }
      
      saveState(state);
      return;
    }
    
    // Detect slow responses (possible throttling)
    if (responseTime > CONFIG.BLOCK_THRESHOLD_MS) {
      log('warn', `Slow response (${responseTime}ms), possible throttling`);
      state.consecutiveBlocks++;
      
      if (state.consecutiveBlocks >= 3) {
        log('error', `Multiple slow responses detected, possible block`);
        await notifyStatusChange(
          CONFIG.TARGET_URL,
          state.lastStatus,
          'BLOCKED',
          true
        );
      }
    } else {
      state.consecutiveBlocks = 0;
    }
    
    const html = await response.text();
    const currentHash = computeHash(html);
    const { status, isFull, isOpen } = extractStatusText(html);
    
    log('info', `Status: ${status} | Hash: ${currentHash.slice(0, 8)}... | Response time: ${responseTime}ms`);
    
    // First run — just store state
    if (state.lastHash === null) {
      log('info', 'First run, storing initial state');
      state.lastHash = currentHash;
      state.lastStatus = status;
      state.lastCheck = new Date().toISOString();
      state.consecutiveErrors = 0;
      saveState(state);
      return;
    }
    
    // Check if status changed
    if (status !== state.lastStatus && status !== 'UNKNOWN') {
      log('info', `🚨 STATUS CHANGED: ${state.lastStatus} → ${status}`);
      
      await notifyStatusChange(
        CONFIG.TARGET_URL,
        state.lastStatus,
        status,
        false
      );
      
      state.lastHash = currentHash;
      state.lastStatus = status;
      state.lastCheck = new Date().toISOString();
      state.consecutiveErrors = 0;
      saveState(state);
      return;
    }
    
    // Hash changed but status didn't (content changed but still full/open)
    if (currentHash !== state.lastHash) {
      log('debug', `Content changed but status remains: ${status}`);
      state.lastHash = currentHash;
    }
    
    state.lastCheck = new Date().toISOString();
    state.consecutiveErrors = 0;
    saveState(state);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log('error', `Error checking website: ${errorMessage}`);
    
    state.consecutiveErrors++;
    
    if (state.consecutiveErrors >= 3) {
      log('error', `Multiple consecutive errors (${state.consecutiveErrors}), possible block`);
      await notifyStatusChange(
        CONFIG.TARGET_URL,
        state.lastStatus,
        'ERROR',
        true
      );
      state.consecutiveBlocks++;
    }
    
    saveState(state);
  }
}

export function getState(): MonitorState {
  return { ...state };
}
