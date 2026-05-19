const cache = require('../config/redis');

/**
 * Cache GET responses keyed by full URL + auth user (if any).
 * Bypassed automatically when Redis is not configured.
 */
const cacheResponse = (ttlSeconds = 60) =>
  async function cacheMw(req, res, next) {
    if (!cache.enabled() || req.method !== 'GET') return next();

    const userPart = req.user ? `:u:${req.user._id}` : '';
    const key = `cache:${req.originalUrl}${userPart}`;
    try {
      const hit = await cache.get(key);
      if (hit) {
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json(hit);
      }
    } catch (e) {
      // ignore
    }

    res.setHeader('X-Cache', 'MISS');
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, body, ttlSeconds).catch(() => {});
      }
      return originalJson(body);
    };
    next();
  };

const invalidate = async (...patterns) => {
  if (!cache.enabled()) return;
  await Promise.all(patterns.map((p) => cache.del(p)));
};

module.exports = { cacheResponse, invalidate };
