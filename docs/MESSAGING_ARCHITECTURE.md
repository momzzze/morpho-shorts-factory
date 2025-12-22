# 📨 Morpho Messaging Architecture

## Overview

This is a **generic, scalable messaging system** using RabbitMQ for communication between Node.js services.

## Architecture

```
┌─────────────┐                              ┌─────────────┐
│   API       │                              │   Worker    │
│ (Node.js)   │                              │  (Node.js)  │
│             │                              │             │
│  Producer   │─────────────────────────────▶│   Consumer  │
│             │   task.created, video.upload │             │
└─────────────┘                              └─────────────┘
       │                                                │
       │                                                │
       └───────────────▶  RabbitMQ  ◀──────────────────┘
                     (Topic Exchange)
```

## Message Flow

### 1. API sends event:

```typescript
POST /api/v1/tasks
→ Publishes event: task.created
→ RabbitMQ routes to: worker.tasks.queue
```

### 2. Worker processes:

```typescript
← Consumes: task.created
→ Does processing (emails, thumbnails, etc.)
→ Publishes result event (optional)
```

## Setup

### Prerequisites

```bash
# Install dependencies
cd apps/api && pnpm install
cd apps/worker && pnpm install

# Install RabbitMQ locally
# Option 1: Docker
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management

# Option 2: k3d (add to k8s/rabbitmq.yaml)
```

### Environment Variables

**API & Worker (.env):**

```bash
RABBIT_URL=amqp://guest:guest@localhost:5672/
```

## Running Services

### Terminal 1 - API:

```bash
cd apps/api
pnpm dev
```

### Terminal 2 - Worker:

```bash
cd apps/worker
pnpm dev
```

## Usage Examples

### Send Generic Task:

```bash
curl -X POST http://localhost:3000/api/v1/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "send-email",
    "data": {
      "to": "user@example.com",
      "subject": "Welcome"
    }
  }'
```

### Send Video Upload Event:

```bash
curl -X POST http://localhost:3000/api/v1/videos/upload \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "filePath": "/uploads/video.mp4",
    "metadata": {
      "duration": 120,
      "size": 5242880,
      "format": "mp4"
    }
  }'
```

## Adding New Events

### 1. Define event type in `packages/shared/src/events/types.ts`:

```typescript
export enum EventType {
  MY_NEW_EVENT = 'my.new.event',
}

export interface MyNewEvent extends BaseEvent {
  type: EventType.MY_NEW_EVENT;
  payload: {
    // your data here
  };
}
```

### 2. Publish from API:

```typescript
await rabbitMQ.publish({
  id: randomUUID(),
  type: EventType.MY_NEW_EVENT,
  timestamp: new Date(),
  payload: {
    /* data */
  },
});
```

### 3. Consume in Worker:

```typescript
await rabbitMQ.subscribe(EventType.MY_NEW_EVENT, async (event) => {
  // handle event
});
```

## Production Deployment

### Dev Environment:

- Use CloudAMQP Free Tier (separate instance)
- URL: `amqps://xxx:xxx@woodpecker.rmq.cloudamqp.com/xxx`

### Prod Environment:

- Use CloudAMQP (paid plan for reliability)
- Or self-host RabbitMQ cluster in k8s

### Railway Configuration:

**For each service (api, worker):**

```
RABBIT_URL=amqps://your-cloudamqp-url
```

## Monitoring

### RabbitMQ Management UI:

- Local: http://localhost:15672
- CloudAMQP: Dashboard URL from provider

### Key Metrics:

- Queue depth (should be near 0)
- Message rate (in/out)
- Consumer count
- Failed messages (check DLX)

## Troubleshooting

### Messages not being consumed:

1. Check service is running
2. Check RABBIT_URL is correct
3. Check queue bindings in RabbitMQ UI

### Dead Letter Queue (DLX):

```bash
# Check failed messages
# Go to RabbitMQ UI → Queues → morpho.dlx
```

### Connection issues:

```bash
# Test connection
telnet localhost 5672  # or your CloudAMQP host
```

## Best Practices

✅ **DO:**

- Use correlation IDs for request tracking
- Handle errors gracefully (they go to DLX)
- Use persistent messages for important data
- Monitor queue depths
- Separate dev/prod RabbitMQ instances

❌ **DON'T:**

- Share RabbitMQ between dev and prod
- Forget to acknowledge messages
- Use synchronous requests for slow operations
- Put large payloads in messages (use reference IDs instead)

## Scaling

### Horizontal Scaling:

- Run multiple worker instances
- RabbitMQ automatically distributes messages
- Each worker gets different messages (round-robin)

### Example:

```bash
# Run 3 worker instances
docker compose up --scale worker=3
```

## Links

- [RabbitMQ Tutorials](https://www.rabbitmq.com/tutorials)
- [CloudAMQP Free Tier](https://www.cloudamqp.com/plans.html)
