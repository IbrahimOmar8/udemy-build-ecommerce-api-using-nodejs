const Redis = require('ioredis');

let client = null;

const enabled = () => !!process.env.REDIS_URL;

const getClient = () => {
  if (!enabled()) return null;
  if (client) return client;
  client = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: false,
  });
  client.on('error', (err) => {
    console.error('Redis error:', err.message);
  });
  return client;
};

const get = async (key) => {
  const c = getClient();
  if (!c) return null;
  const raw = await c.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return raw;
  }
};

const set = async (key, value, ttlSeconds = 300) => {
  const c = getClient();
  if (!c) return;
  const payload = typeof value === 'string' ? value : JSON.stringify(value);
  if (ttlSeconds > 0) {
    await c.set(key, payload, 'EX', ttlSeconds);
  } else {
    await c.set(key, payload);
  }
};

const del = async (pattern) => {
  const c = getClient();
  if (!c) return;
  if (pattern.includes('*')) {
    const keys = await c.keys(pattern);
    if (keys.length) await c.del(keys);
  } else {
    await c.del(pattern);
  }
};

module.exports = { getClient, get, set, del, enabled };
