// ==============================================================================
// RabbitMQ Consumer (if needed in API)
// ==============================================================================

import amqplib from 'amqplib';

interface RabbitMQConfig {
  url: string;
  exchange?: string;
}

export type MessageHandler = (message: any) => Promise<void>;

export class RabbitMQConsumer {
  private connection: Awaited<ReturnType<typeof amqplib.connect>> | null = null;
  private channel: Awaited<
    ReturnType<Awaited<ReturnType<typeof amqplib.connect>>['createChannel']>
  > | null = null;
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

      if (!this.connection) {
        throw new Error('Failed to create RabbitMQ connection');
      }

      this.channel = await this.connection.createChannel();

      if (!this.channel) {
        throw new Error('Failed to create RabbitMQ channel');
      }

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
        console.log(`📨 Received message from ${routingKey}:`, {
          routingKey,
          queueName,
          messageType: message.type || 'unknown',
        });

        await handler(message);

        this.channel!.ack(msg);
        console.log(`✅ Message processed from ${routingKey}`);
      } catch (error) {
        console.error(`❌ Error processing message from ${routingKey}:`, error);
        this.channel!.nack(msg, false, false);
      }
    });
  }

  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      console.log('👋 RabbitMQ Consumer closed');
    } catch (error) {
      console.error('Error closing RabbitMQ consumer:', error);
    }
  }
}
