# How to Send Messages to RabbitMQ

## 🔧 Setting the RabbitMQ URL

### 1. Create `.env` file in `apps/api/`

```env
RABBIT_URL=amqp://localhost:5672
```

**Examples:**

- Local: `amqp://localhost:5672`
- Kubernetes: `amqp://rabbitmq-service:5672`
- With auth: `amqp://username:password@host:5672`
- Docker: `amqp://rabbitmq:5672`

### 2. The URL is automatically loaded from `env.ts`

The API reads `RABBIT_URL` from your environment variables and uses it to connect to RabbitMQ on startup.

---

## 📤 Sending Messages - 3 Ways

### Method 1: Using the Message Service (Recommended)

```typescript
import { messageService } from './services/messageService.js';

// Send a task
await messageService.sendTaskCreated({
  taskId: '123',
  userId: 'user-456',
  type: 'video-processing',
  payload: { videoUrl: 'https://example.com/video.mp4' },
});

// Send a video upload
await messageService.sendVideoUpload({
  videoId: 'video-789',
  userId: 'user-456',
  url: 'https://example.com/video.mp4',
  metadata: { duration: 60, size: 1024 },
});
```

### Method 2: Using the Producer Directly

```typescript
import { getProducer } from './rabbitmq/setup.js';

const producer = getProducer();

// Send any message
await producer.sendMessage('task.created', {
  taskId: '123',
  userId: 'user-456',
  taskType: 'thumbnail-generation',
  payload: { videoId: 'abc' },
  createdAt: new Date().toISOString(),
});

// Send to different routing key
await producer.sendMessage('user.registered', {
  userId: '123',
  email: 'user@example.com',
  createdAt: new Date().toISOString(),
});
```

### Method 3: Via HTTP Endpoint

```bash
# Send task message
curl -X POST http://localhost:5001/api/v1/messages/task \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "123",
    "userId": "user-456",
    "type": "video-processing",
    "payload": {"videoUrl": "https://..."}
  }'

# Send video message
curl -X POST http://localhost:5001/api/v1/messages/video \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "video-789",
    "userId": "user-456",
    "url": "https://...",
    "metadata": {}
  }'
```

---

## 🎯 Example: Send Message from Your Code

**In any controller or service:**

```typescript
// apps/api/src/controllers/videoController.ts
import { messageService } from '../services/messageService.js';

export class VideoController {
  async processVideo(req: Request, res: Response): Promise<void> {
    const { videoId, userId, url } = req.body;

    // Send message to RabbitMQ
    await messageService.sendVideoUpload({
      videoId,
      userId,
      url,
      metadata: { format: 'mp4' },
    });

    res.json({ success: true, message: 'Video processing started' });
  }
}
```

---

## 📥 Messages Are Automatically Received

When another service sends a message to RabbitMQ, your API automatically receives it and processes it in [handlers.ts](src/rabbitmq/handlers.ts)!

**Flow:**

```
Your Code → messageService.sendTaskCreated() → RabbitMQ → Worker receives message
Worker sends response → RabbitMQ → Your API's consumer → handlers.ts processes it
```

---

## ✅ Quick Test

1. **Set RabbitMQ URL:**

   ```bash
   # Create .env file
   echo "RABBIT_URL=amqp://localhost:5672" > apps/api/.env
   ```

2. **Start the API:**

   ```bash
   cd apps/api
   pnpm dev
   ```

3. **Send a test message:**

   ```bash
   curl -X POST http://localhost:5001/api/v1/messages/task \
     -H "Content-Type: application/json" \
     -d '{"taskId": "test-1", "userId": "user-1", "type": "test", "payload": {}}'
   ```

4. **Check the logs** - you should see:
   ```
   📤 Message sent to task.created
   ```
