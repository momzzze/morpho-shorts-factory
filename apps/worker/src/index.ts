// ==============================================================================
// Worker Service - Generic Task Consumer
// ==============================================================================

import {
  RabbitMQClient,
  EventType,
  TaskCreatedEvent,
  VideoUploadEvent,
  VideoProcessEvent,
} from '@morpho/shared';

// Initialize RabbitMQ
const rabbitMQ = new RabbitMQClient({
  url: process.env.RABBIT_URL!,
});

// Connect
await rabbitMQ.connect();

/**
 * Handle generic tasks
 */
async function handleTask(event: TaskCreatedEvent): Promise<void> {
  console.log(`📋 Processing task: ${event.payload.taskType}`);
  console.log(`Task ID: ${event.payload.taskId}`);
  console.log(`Data:`, event.payload.data);

  // ========================================
  // YOUR TASK LOGIC HERE
  // ========================================
  // Example: Process based on task type
  switch (event.payload.taskType) {
    case 'send-email':
      console.log('Sending email...');
      break;
    case 'generate-thumbnail':
      console.log('Generating thumbnail...');
      break;
    default:
      console.log('Unknown task type');
  }

  // Simulate processing
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log(`✅ Task completed: ${event.payload.taskId}`);
}

/**
 * Handle video uploads
 */
async function handleVideoUpload(event: VideoUploadEvent): Promise<void> {
  console.log(`🎥 Processing video upload: ${event.payload.videoId}`);
  console.log(`User: ${event.payload.userId}`);
  console.log(`File: ${event.payload.filePath}`);

  // ========================================
  // YOUR VIDEO PROCESSING LOGIC HERE
  // ========================================
  // Example: Validate video, create thumbnails, extract metadata, etc.

  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log(`✅ Video processed: ${event.payload.videoId}`);
}

/**
 * Start worker
 */
async function startWorker() {
  try {
    console.log('🔧 Starting Worker Service...');

    // Subscribe to task events
    await rabbitMQ.subscribe(
      EventType.TASK_CREATED,
      async (event) => {
        if (event.type === EventType.TASK_CREATED) {
          await handleTask(event as TaskCreatedEvent);
        }
      },
      'worker.tasks.queue'
    );

    // Subscribe to video uploads
    await rabbitMQ.subscribe(
      EventType.VIDEO_UPLOAD,
      async (event) => {
        if (event.type === EventType.VIDEO_UPLOAD) {
          await handleVideoUpload(event as VideoUploadEvent);
        }
      },
      'worker.videos.queue'
    );

    console.log('✅ Worker Service started and listening...');
    console.log('   - Listening for: TASK_CREATED');
    console.log('   - Listening for: VIDEO_UPLOAD');

    // Keep process running
    process.on('SIGINT', async () => {
      console.log('Shutting down worker...');
      await rabbitMQ.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Worker startup error:', error);
    process.exit(1);
  }
}

// Start the worker
startWorker();
