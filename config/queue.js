const { Queue, Worker, QueueEvents } = require('bullmq');
const IORedis = require('ioredis');

let connection = null;
const getConnection = () => {
  if (!process.env.REDIS_URL) return null;
  if (!connection) {
    connection = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
    });
  }
  return connection;
};

const queues = {};

const getQueue = (name) => {
  const conn = getConnection();
  if (!conn) return null;
  if (!queues[name]) {
    queues[name] = new Queue(name, { connection: conn });
  }
  return queues[name];
};

/**
 * Enqueue a job. Falls back to inline execution when Redis is not configured
 * (so the app keeps working in dev/test without Redis).
 */
const enqueue = async (queueName, jobName, data, fallback) => {
  const q = getQueue(queueName);
  if (q) {
    return q.add(jobName, data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 100 },
    });
  }
  // No Redis — run inline (best-effort)
  if (typeof fallback === 'function') {
    try {
      await fallback();
    } catch (e) {
      console.error(`[queue:${queueName}] inline fallback failed:`, e.message);
    }
  }
  return null;
};

const startWorker = (queueName, processor) => {
  const conn = getConnection();
  if (!conn) return null;
  const w = new Worker(queueName, processor, { connection: conn });
  w.on('failed', (job, err) => {
    console.error(`[worker:${queueName}] job ${job?.id} failed:`, err.message);
  });
  return w;
};

module.exports = { getQueue, enqueue, startWorker };
