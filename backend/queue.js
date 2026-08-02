import Redis from 'ioredis';
import mongoose from 'mongoose';

// Connect to Redis instance (Local or Upstash/Redis Cloud)
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
export const redisPublisher = new Redis(redisUrl);
export const redisSubscriber = new Redis(redisUrl);

const QUEUE_NAME = 'telemetry_ingestion_queue';

/**
 * Pushes raw high-frequency telemetry packet to Redis Queue
 */
export const enqueueTelemetry = async (packet) => {
  try {
    await redisPublisher.lpush(QUEUE_NAME, JSON.stringify(packet));
    // Publish to Pub/Sub channel for live UI streaming
    await redisPublisher.publish('telemetry_stream', JSON.stringify(packet));
  } catch (err) {
    console.error('[Redis Queue Error]:', err.message);
  }
};

/**
 * Worker process consuming queued packets into MongoDB in batch
 */
export const startQueueWorker = (TelemetryModel) => {
  console.log('⚡ [Redis Queue Worker] Active and listening for telemetry batches...');

  setInterval(async () => {
    try {
      const packets = [];
      // Drain up to 100 items from queue at once for bulk insertion
      for (let i = 0; i < 100; i++) {
        const item = await redisPublisher.rpop(QUEUE_NAME);
        if (!item) break;
        packets.push(JSON.parse(item));
      }

      if (packets.length > 0) {
        await TelemetryModel.insertMany(packets, { ordered: false });
        console.log(`📦 [Redis Worker] Batch persisted ${packets.length} telemetry records to MongoDB.`);
      }
    } catch (err) {
      console.error('[Worker Batch Ingest Error]:', err.message);
    }
  }, 1000); // Ingest every 1 second
};