const env = require("../config/env");

let redisClient = null;
let connectionAttempted = false;

function getClient() {
  if (!env.REDIS_URL) return null;
  if (connectionAttempted) return redisClient;

  connectionAttempted = true;
  try {
    // Lazily required so the app never even loads ioredis (let alone tries
    // to connect) when Redis isn't configured — consistent with how
    // whatsapp.service.js and googleMeet.service.js treat optional
    // integrations elsewhere in this codebase.
    const Redis = require("ioredis");
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // don't keep retrying forever if Redis is down
      lazyConnect: false,
    });
    redisClient.on("error", (err) => {
      console.warn("[cache] Redis error (falling back to no cache):", err.message);
    });
  } catch (err) {
    console.warn("[cache] Redis unavailable, running without cache:", err.message);
    redisClient = null;
  }
  return redisClient;
}

// Fetches from cache; on a miss (or if Redis isn't configured/healthy),
// calls fetchFn(), caches the result, and returns it. Cache failures are
// never allowed to break the actual request — worst case, this behaves
// exactly like there's no cache at all.
async function getOrSetCache(key, ttlSeconds, fetchFn) {
  const client = getClient();
  if (!client) return fetchFn();

  try {
    const cached = await client.get(key);
    if (cached !== null) return JSON.parse(cached);
  } catch (err) {
    console.warn(`[cache] read failed for ${key}:`, err.message);
  }

  const fresh = await fetchFn();

  try {
    await client.set(key, JSON.stringify(fresh), "EX", ttlSeconds ?? env.CACHE_TTL_SECONDS);
  } catch (err) {
    console.warn(`[cache] write failed for ${key}:`, err.message);
  }

  return fresh;
}

// Call after any admin write to content that's cached under `prefix` — e.g.
// invalidateByPrefix("faq:") after an admin edits an FAQ. Uses SCAN rather
// than KEYS to avoid blocking Redis on a large keyspace.
async function invalidateByPrefix(prefix) {
  const client = getClient();
  if (!client) return;

  try {
    const stream = client.scanStream({ match: `${prefix}*` });
    const keysToDelete = [];
    for await (const keys of stream) {
      keysToDelete.push(...keys);
    }
    if (keysToDelete.length > 0) await client.del(...keysToDelete);
  } catch (err) {
    console.warn(`[cache] invalidation failed for prefix ${prefix}:`, err.message);
  }
}

module.exports = { getOrSetCache, invalidateByPrefix };
