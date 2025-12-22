# API Service - RabbitMQ Consumer Architecture

## 🐰 What This API Does

**The API is a RabbitMQ CONSUMER that automatically listens to messages on startup.**

It does NOT just provide HTTP endpoints - it actively processes messages from RabbitMQ!

## Folder Structure

```
src/
├── rabbitmq/            # 🐰 RabbitMQ setup (most important!)
│   ├── setup.ts         # Initializes on startup, connects consumer
│   ├── producer.ts      # Send messages TO RabbitMQ
│   ├── consumer.ts      # Receive messages FROM RabbitMQ
│   └── handlers.ts      # Process incoming messages (YOUR LOGIC HERE)
├── controllers/         # HTTP request handlers (optional)
├── services/            # Business logic
├── utils/               # Helper functions
├── middleware/          # Express middleware
├── routes/              # API endpoints
└── index.ts             # Entry point - starts RabbitMQ consumer!
```

## 🚀 How It Works

### On Startup (Automatic)

1. **Server starts** (`index.ts`)
2. **RabbitMQ initializes** (`rabbitmq/setup.ts`)

   - Producer connects (for sending messages)
   - Consumer connects (for receiving messages)
   - Consumer subscribes to queues:
     - `task.created` → `morpho-api-tasks` queue
     - `video.upload` → `morpho-api-videos` queue

3. **API is now listening for RabbitMQ messages!** 📥

### When a Message Arrives

```
Other Service → RabbitMQ → API Consumer → handlers.ts → Process Message → Done ✅
```

## 🛠️ Add Your Processing Logic

**Edit `rabbitmq/handlers.ts`** to add your business logic:

```typescript
export async function handleTaskMessage(message: TaskMessage): Promise<void> {
  logger.info('📋 Processing task from RabbitMQ');

  // ========================================
  // YOUR LOGIC HERE
  // ========================================

  switch (message.taskType) {
    case 'video-processing':
      // Process video
      await processVideo(message.payload);
      break;

    case 'thumbnail-generation':
      // Generate thumbnail
      await generateThumbnail(message.payload);
      break;
  }
}
```

## 📤 Sending Messages (Optional)

You can also SEND messages to RabbitMQ:

### From Code

```typescript
import { getProducer } from './rabbitmq/setup.js';

const producer = getProducer();
await producer.sendMessage('task.created', {
  taskId: '123',
  userId: 'user-456',
  taskType: 'video-processing',
  payload: { videoUrl: 'https://...' },
});
```

### Via HTTP Endpoint (optional)

```bash
POST http://localhost:5001/api/v1/messages/task
{
  "taskId": "123",
  "userId": "user-456",
  "type": "video-processing",
  "payload": {}
}
```

## 🔧 Environment Variables

```env
NODE_ENV=development
PORT=5001
RABBIT_URL=amqp://localhost:5672
```

## 📝 Key Files

- **`rabbitmq/setup.ts`** - Initializes RabbitMQ on startup, connects producer + consumer
- **`rabbitmq/handlers.ts`** - YOUR business logic for processing messages
- **`rabbitmq/producer.ts`** - Class for sending messages
- **`rabbitmq/consumer.ts`** - Class for receiving messages
- **`index.ts`** - Calls `initializeRabbitMQ()` on startup

## 🎯 Quick Start

1. Set `RABBIT_URL` environment variable
2. Add your logic to `rabbitmq/handlers.ts`
3. Run `pnpm dev`
4. API automatically starts consuming messages! 🎉
