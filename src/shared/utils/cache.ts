// lightweight async memo with TTL
type CacheEntry<T> = { value: T; expiresAt: number }
const CACHE = new Map<string, CacheEntry<unknown>>()

export const defineCached = <TArgs extends unknown[], TResult>(
  key: string,
  fn: (...args: TArgs) => Promise<TResult>,
  ttlSeconds = 60
) => {
  return async (...args: TArgs): Promise<TResult> => {
    const cacheKey = `${key}:${JSON.stringify(args)}`
    const now = Date.now()
    const hit = CACHE.get(cacheKey)
    if (hit && hit.expiresAt > now) return hit.value as TResult

    const value = await fn(...args)
    CACHE.set(cacheKey, { value, expiresAt: now + ttlSeconds * 1000 })
    return value
  }
}

export default defineCached
