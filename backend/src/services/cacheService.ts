interface CacheEntry<T> {
  data: T;
  expiry: number;
}

class MemoryCache {
  private store: Map<string, CacheEntry<any>> = new Map();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number = 60 * 60 * 1000): void {
    this.store.set(key, {
      data,
      expiry: Date.now() + ttlMs,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}

export const cache = new MemoryCache();

export function getCacheKey(prefix: string, userId: string, suffix?: string): string {
  return suffix ? `${prefix}:${userId}:${suffix}` : `${prefix}:${userId}`;
}

export const CACHE_TTL = {
  PORTFOLIO_ANALYSIS: 60 * 60 * 1000,
  TAX_OPTIMIZATION: 60 * 60 * 1000,
  REBALANCE: 30 * 60 * 1000,
  GOAL_PREDICTION: 15 * 60 * 1000,
};
