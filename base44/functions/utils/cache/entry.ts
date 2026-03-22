// Simple in-memory cache for Deno (no external dependencies)
// Note: Cache resets on cold starts, but helps reduce duplicate API calls within a session

const caches = new Map();

const CACHE_CONFIG = {
  predictions: { ttl: 10 * 60 * 1000, max: 1000 },     // 10 minutes
  playerStats: { ttl: 5 * 60 * 1000, max: 500 },       // 5 minutes
  teamStats: { ttl: 5 * 60 * 1000, max: 500 },         // 5 minutes
  externalAPI: { ttl: 2 * 60 * 1000, max: 500 },       // 2 minutes
  sportsStats: { ttl: 24 * 60 * 60 * 1000, max: 200 }, // 24 hours
};

function getCache(cacheType) {
  if (!caches.has(cacheType)) {
    caches.set(cacheType, new Map());
  }
  return caches.get(cacheType);
}

function isExpired(entry, ttl) {
  return Date.now() - entry.timestamp > ttl;
}

function pruneCache(cache, config) {
  // Remove expired entries
  for (const [key, entry] of cache.entries()) {
    if (isExpired(entry, config.ttl)) {
      cache.delete(key);
    }
  }
  
  // If still over max, remove oldest entries
  if (cache.size > config.max) {
    const entries = Array.from(cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = entries.slice(0, cache.size - config.max);
    toRemove.forEach(([key]) => cache.delete(key));
  }
}

/**
 * Generate a cache key from an object by sorting and stringifying
 */
export function generateCacheKey(prefix, data) {
  const sortedData = Object.keys(data || {})
    .sort()
    .reduce((acc, key) => {
      acc[key] = data[key];
      return acc;
    }, {});
  return `${prefix}:${JSON.stringify(sortedData)}`;
}

/**
 * Wrapper for cached computation
 */
export async function withCache(cacheType, key, computeFn) {
  const config = CACHE_CONFIG[cacheType];
  if (!config) {
    console.warn(`Unknown cache type: ${cacheType}`);
    return await computeFn();
  }

  const cache = getCache(cacheType);
  
  // Check cache
  const cached = cache.get(key);
  if (cached && !isExpired(cached, config.ttl)) {
    console.log(`Cache HIT: ${cacheType}:${key.substring(0, 50)}...`);
    return cached.value;
  }

  // Cache miss - compute and store
  console.log(`Cache MISS: ${cacheType}:${key.substring(0, 50)}...`);
  const value = await computeFn();
  
  cache.set(key, { value, timestamp: Date.now() });
  pruneCache(cache, config);
  
  return value;
}

/**
 * Clear specific cache or all caches
 */
export function clearCache(cacheType = null) {
  if (cacheType && caches.has(cacheType)) {
    caches.get(cacheType).clear();
    console.log(`Cleared ${cacheType} cache`);
  } else if (!cacheType) {
    caches.clear();
    console.log('Cleared all caches');
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const stats = {};
  for (const [type, cache] of caches.entries()) {
    const config = CACHE_CONFIG[type] || { ttl: 0, max: 0 };
    stats[type] = {
      size: cache.size,
      max: config.max,
      ttl: config.ttl,
    };
  }
  return stats;
}