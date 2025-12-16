// LRU Cache utility for predictions and API results
import { LRUCache } from 'lru-cache';

// Cache configurations for different use cases
const caches = {
  // Predictions cache - 10 minutes TTL, 1000 entries max
  predictions: new LRUCache({
    max: 1000,
    ttl: 1000 * 60 * 10, // 10 minutes
    updateAgeOnGet: true,
  }),
  
  // Player stats cache - 5 minutes TTL, 500 entries max
  playerStats: new LRUCache({
    max: 500,
    ttl: 1000 * 60 * 5, // 5 minutes
    updateAgeOnGet: true,
  }),
  
  // Team stats cache - 5 minutes TTL, 500 entries max
  teamStats: new LRUCache({
    max: 500,
    ttl: 1000 * 60 * 5, // 5 minutes
    updateAgeOnGet: true,
  }),
  
  // External API cache - 2 minutes TTL (odds change frequently)
  externalAPI: new LRUCache({
    max: 500,
    ttl: 1000 * 60 * 2, // 2 minutes
    updateAgeOnGet: true,
  }),
  
  // Sports stats cache - 30 minutes TTL (standings/leaders change slowly)
  sportsStats: new LRUCache({
    max: 200,
    ttl: 1000 * 60 * 30, // 30 minutes
    updateAgeOnGet: true,
  }),
};

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
 * @param {string} cacheType - Type of cache to use ('predictions', 'playerStats', 'teamStats', 'externalAPI')
 * @param {string} key - Cache key
 * @param {Function} computeFn - Async function to compute value if cache miss
 * @returns {Promise} Cached or computed value
 */
export async function withCache(cacheType, key, computeFn) {
  const cache = caches[cacheType];
  if (!cache) {
    console.warn(`Unknown cache type: ${cacheType}`);
    return await computeFn();
  }

  // Check cache
  const cached = cache.get(key);
  if (cached !== undefined) {
    console.log(`Cache HIT: ${cacheType}:${key.substring(0, 50)}...`);
    return cached;
  }

  // Cache miss - compute and store
  console.log(`Cache MISS: ${cacheType}:${key.substring(0, 50)}...`);
  const value = await computeFn();
  cache.set(key, value);
  return value;
}

/**
 * Clear specific cache or all caches
 */
export function clearCache(cacheType = null) {
  if (cacheType && caches[cacheType]) {
    caches[cacheType].clear();
    console.log(`Cleared ${cacheType} cache`);
  } else if (!cacheType) {
    Object.keys(caches).forEach(type => caches[type].clear());
    console.log('Cleared all caches');
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return Object.keys(caches).reduce((stats, type) => {
    const cache = caches[type];
    stats[type] = {
      size: cache.size,
      max: cache.max,
      ttl: cache.ttl,
    };
    return stats;
  }, {});
}