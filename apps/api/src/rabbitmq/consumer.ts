// ==============================================================================
// RabbitMQ Consumer (if needed in API)
// ==============================================================================

import amqplib, { Channel, Connection } from 'amqplib';

interface RabbitMQConfig {
  url: string;
  exchange?: string;
}

export type MessageHandler = (message: any) => Promise<void>;

export class RabbitMQConsumer {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private readonly config: Required<RabbitMQConfig>;

  constructor(config: RabbitMQConfig) {
    this.config = {
      url: config.url,
      exchange: config.exchange || 'morpho.events',
    };
  }

  async connect(): Promise<void> {
    try {
      console.log('🐰 Connecting to RabbitMQ Consumer...');
      this.connection = await amqplib.connect(this.config.url);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(this.config.exchange, 'topic', {
        durable: true,
      });

      console.log('✅ RabbitMQ Consumer connected');
    } catch (error) {
      console.error('❌ Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  async subscribe(
    routingKey: string,
    queueName: string,
    handler: MessageHandler
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ not connected');
    }

    await this.channel.assertQueue(queueName, { durable: true });
    await this.channel.bindQueue(queueName, this.config.exchange, routingKey);
    await this.channel.prefetch(1);

    console.log(`📥 Subscribed to ${routingKey} on queue: ${queueName}`);

    await this.channel.consume(queueName, async (msg) => {
      if (!msg) return;

      try {
        const message = JSON.parse(msg.content.toString());
        console.log(`📨 Received message from ${routingKey}`);

        await handler(message);

        this.channel!.ack(msg);
        console.log(`✅ Message processed`);
      } catch (error) {
        console.error(`❌ Error processing message:`, error);
        this.channel!.nack(msg, false, false);
      }
    });
  }

  async close(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
    console.log('👋 RabbitMQ Consumer closed');
  }
}
