import NodeCache from 'node-cache';
import stringify from 'safe-stable-stringify';

// Type for any async function
type AnyAsyncFn<TArgs extends any[], TResult> = (...args: TArgs) => Promise<TResult>;

// Cache and pending maps
const cache = new NodeCache();
const pending: Record<string, Promise<any>> = {};

/**
 * Wraps an async function with TTL cache and deduplication.
 *
 * @param keyBase   - Unique key for this function (string)
 * @param fn        - Your async function
 * @param ttl       - Cache time in seconds (default: 600)
 */
export function defineCached<TArgs extends any[], TResult>(
  keyBase: string,
  fn: AnyAsyncFn<TArgs, TResult>,
  ttl: number = 600
): AnyAsyncFn<TArgs, TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    // Compose a cache key from base + stringified args
    const cacheKey = `${keyBase}:${stringify(args)}`;

    // Return cached if available
    const cached = cache.get<TResult>(cacheKey);
    if (cached) return cached;

    // Deduplicate: if already pending, return in-progress promise
    if (pending[cacheKey] !== undefined) return pending[cacheKey];

    // Otherwise, start the fetch, cache, and dedupe
    pending[cacheKey] = (async () => {
      const result = await fn(...args);
      cache.set(cacheKey, result, ttl);
      return result;
    })();

    try {
      return await pending[cacheKey];
    } finally {
      delete pending[cacheKey];
    }
  };
}
