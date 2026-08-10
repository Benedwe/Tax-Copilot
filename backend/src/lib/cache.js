/**
 * In-Memory TTL Cache for Backend API Responses and Queries
 */

class MemoryCache {
  constructor() {
    this.store = new Map();
  }

  set(key, value, ttlMs = 60000) {
    const expiresAt = Date.now() + ttlMs;
    this.store.set(key, { value, expiresAt });
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }

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

  clear() {
    this.store.clear();
  }
}

export const memoryCache = new MemoryCache();

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
