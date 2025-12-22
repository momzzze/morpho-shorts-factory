// ==============================================================================
// RabbitMQ Setup - Initialize producer and consumers on startup
// ==============================================================================

import { RabbitMQProducer } from './producer.js';
import { RabbitMQConsumer } from './consumer.js';
import {
  handleTaskMessage,
  handleVideoMessage,
  handleThumbnailMessage,
} from './handlers.js';
import { env } from '../env.js';
import { logger } from '../logger.js';

let producer: RabbitMQProducer | null = null;
let consumer: RabbitMQConsumer | null = null;

/**
 * Initialize RabbitMQ connections
 */
export async function initializeRabbitMQ(): Promise<void> {
  const rabbitUrl = env.RABBIT_URL;

  if (!rabbitUrl) {
    logger.warn('⚠️  RABBIT_URL not set, skipping RabbitMQ initialization');
    return;
  }

  try {
    logger.info('🐰 Initializing RabbitMQ...');

    // Initialize Producer
    producer = new RabbitMQProducer({ url: rabbitUrl });
    await producer.connect();

    // Initialize Consumer
    consumer = new RabbitMQConsumer({ url: rabbitUrl });
    await consumer.connect();

    // Subscribe to task messages
    await consumer.subscribe(
      'task.created',
      'morpho-api-tasks',
      handleTaskMessage
    );

    // Subscribe to video upload messages
    await consumer.subscribe(
      'video.upload',
      'morpho-api-videos',
      handleVideoMessage
    );

    // Subscribe to thumbnail generation messages
    await consumer.subscribe(
      'thumbnail.created',
      'morpho-api-thumbnails',
      handleThumbnailMessage
    );

    // You can add more subscriptions here:
    // await consumer.subscribe('user.created', 'morpho-api-users', handleUserMessage);
    // await consumer.subscribe('transcode.started', 'morpho-api-transcode', handleTranscodeMessage);

    logger.info('✅ RabbitMQ initialized and listening for messages');
  } catch (error) {
    logger.error({ error }, '❌ Failed to initialize RabbitMQ');
    throw error;
  }
}

/**
 * Get the producer instance for sending messages
 */
export function getProducer(): RabbitMQProducer {
  if (!producer) {
    throw new Error('RabbitMQ producer not initialized');
  }
  return producer;
}

/**
 * Close all RabbitMQ connections
 */
export async function closeRabbitMQ(): Promise<void> {
  logger.info('Closing RabbitMQ connections...');
  await consumer?.close();
  await producer?.close();
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await closeRabbitMQ();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeRabbitMQ();
  process.exit(0);
});
