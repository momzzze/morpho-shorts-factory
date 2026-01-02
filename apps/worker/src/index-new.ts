/**
 * Worker Service - Updated to handle stocks sync jobs
 *
 * This is a standalone worker that processes background jobs
 * Start with: pnpm dev:worker
 */

import 'dotenv/config';
import { RabbitMQConsumer } from '../../api/src/rabbitmq/consumer.js';
import { handleStocksSyncMessage } from '../../api/src/rabbitmq/handlers.js';
import type { StocksSyncMessage } from '../../api/src/rabbitmq/handlers.js';

const RABBIT_URL = process.env.RABBIT_URL || 'amqp://localhost:5672';

async function startWorker() {
  console.log('🔧 Starting Morpho Worker Service...\n');

  try {
    // Initialize RabbitMQ consumer
    const consumer = new RabbitMQConsumer({
      url: RABBIT_URL,
      exchange: 'morpho.events',
    });

    await consumer.connect();

    // Subscribe to stocks sync jobs
    await consumer.subscribe(
      'stocks.sync',
      'worker.stocks.sync.queue',
      async (message: StocksSyncMessage) => {
        console.log(`📈 Processing stocks sync job: ${message.jobId}`);
        await handleStocksSyncMessage(message);
      }
    );

    console.log('✅ Worker Service started successfully!');
    console.log('   Listening for:');
    console.log('   - stocks.sync (SEC data ingestion)\n');

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down worker...');
      await consumer.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Shutting down worker...');
      await consumer.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Worker startup error:', error);
    process.exit(1);
  }
}

// Start the worker
startWorker();
