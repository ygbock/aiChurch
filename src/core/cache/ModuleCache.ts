type CacheItem<T> = {
  data: T;
  timestamp: number;
  ttl: number; // ms
};

class ModuleCacheService {
  private cache: Map<string, CacheItem<any>> = new Map();
  private static instance: ModuleCacheService;

  private constructor() {}

  static getInstance() {
    if (!ModuleCacheService.instance) {
      ModuleCacheService.instance = new ModuleCacheService();
    }
    return ModuleCacheService.instance;
  }

  // Set item in cache
  public set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000) { // Default 5 mins TTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // Get item if valid, otherwise return null
  public get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const isExpired = Date.now() - item.timestamp > item.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  // Delete specific key
  public invalidate(key: string) {
    this.cache.delete(key);
  }

  // Clear all cache elements matching prefix (e.g. "finance:")
  public invalidatePrefix(prefix: string) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  public clear() {
    this.cache.clear();
  }
}

export const moduleCache = ModuleCacheService.getInstance();
