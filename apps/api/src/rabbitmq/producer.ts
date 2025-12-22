// ==============================================================================
// RabbitMQ Producer
// ==============================================================================

import amqplib, { Channel, Connection } from 'amqplib';

interface RabbitMQConfig {
  url: string;
  exchange?: string;
}

export class RabbitMQProducer {
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
      console.log('🐰 Connecting to RabbitMQ...');
      this.connection = await amqplib.connect(this.config.url);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(this.config.exchange, 'topic', {
        durable: true,
      });

      console.log('✅ RabbitMQ Producer connected');
    } catch (error) {
      console.error('❌ Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  async sendMessage(routingKey: string, message: any): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ not connected. Call connect() first.');
    }

    const messageBuffer = Buffer.from(JSON.stringify(message));

    this.channel.publish(this.config.exchange, routingKey, messageBuffer, {
      persistent: true,
      contentType: 'application/json',
      timestamp: Date.now(),
    });

    console.log(`📤 Message sent to ${routingKey}`);
  }

  async close(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
    console.log('👋 RabbitMQ connection closed');
  }
}
