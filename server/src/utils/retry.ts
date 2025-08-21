export interface RetryOptions {
  retries?: number;
  minDelayMs?: number;
  maxDelayMs?: number;
  factor?: number;
  timeoutMs?: number;
}

export async function retry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const retries = options.retries ?? 3;
  let delay = options.minDelayMs ?? 200;
  const maxDelay = options.maxDelayMs ?? 5000;
  const factor = options.factor ?? 2;
  const timeoutMs = options.timeoutMs ?? 15000;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let lastError: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await fn();
      clearTimeout(timeout);
      return result;
    } catch (err) {
      lastError = err;
      if (attempt === retries) break;
      await new Promise(r => setTimeout(r, delay));
      delay = Math.min(maxDelay, delay * factor);
    }
  }
  clearTimeout(timeout);
  throw lastError;
}


