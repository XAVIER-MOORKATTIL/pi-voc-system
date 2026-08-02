import Redis from 'ioredis';

// Connect to Redis instance (local fallback or Cloud Redis URL)
const redisHost = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export const redisPublisher = new Redis(redisHost, { lazyConnect: true });
export const redisSubscriber = new Redis(redisHost, { lazyConnect: true });

redisPublisher.on('connect', () => console.log('[Redis Pub/Sub] Publisher Connected'));
redisPublisher.on('error', (err) => console.warn('[Redis Warning] Operating without active Redis queue:', err.message));

/**
 * Publish raw high-frequency telemetry events to asynchronous worker queue
 */
export async function enqueueTelemetry(telemetryPacket) {
  try {
    if (redisPublisher.status === 'ready') {
      await redisPublisher.publish('telemetry-queue', JSON.stringify(telemetryPacket));
    }
  } catch (err) {
    // Non-blocking fallback
  }
}