/**
 * Bounded High-Performance In-Memory Cache with LRU Eviction & Periodic Pruning
 */

class MemoryCache {
  constructor(maxSize = 2000) {
    this.store = new Map();
    this.maxSize = maxSize;

    // Periodically prune expired items every 60 seconds
    const interval = setInterval(() => this.pruneExpired(), 60000);
    if (interval.unref) interval.unref();
  }

  set(key, value, ttlMs = 60000) {
    const expiresAt = Date.now() + ttlMs;

    // If key already exists, delete it first so insertion refreshes its insertion order (LRU)
    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.maxSize) {
      // Evict oldest item (first key in Map)
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
      }
    }

    this.store.set(key, { value, expiresAt });
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }

    // Refresh position for LRU
    this.store.delete(key);
    this.store.set(key, item);

    return item.value;
  }

  del(key) {
    this.store.delete(key);
  }

  deleteByPrefix(prefix) {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  pruneExpired() {
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (now > item.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  clear() {
    this.store.clear();
  }
}

export const memoryCache = new MemoryCache();

export function invalidateUserCache(userId) {
  if (!userId) return;
  memoryCache.deleteByPrefix(`${userId}:`);
}

/**
 * Express middleware to cache JSON responses for specified TTL in seconds.
 */
export function routeCache(ttlSeconds = 60) {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    const userId = req.user?.id || "public";
    const cacheKey = `${userId}:${req.originalUrl || req.url}`;
    const cachedResponse = memoryCache.get(cacheKey);

    if (cachedResponse) {
      res.setHeader("X-Cache", "HIT");
      res.setHeader("Cache-Control", `private, max-age=${ttlSeconds}`);
      return res.json(cachedResponse);
    }

    res.setHeader("X-Cache", "MISS");

    // Intercept res.json to capture response payload
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        memoryCache.set(cacheKey, body, ttlSeconds * 1000);
      }
      return originalJson(body);
    };

    next();
  };
}

