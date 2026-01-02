// ==============================================================================
// RabbitMQ Message Handlers - Process incoming messages
// ==============================================================================

import { logger } from '../logger.js';

export interface TaskMessage {
  taskId: string;
  userId: string;
  taskType: string;
  payload: any;
  createdAt: string;
}

export interface VideoMessage {
  videoId: string;
  userId: string;
  url: string;
  metadata?: any;
  createdAt: string;
}

export interface ThumbnailMessage {
  thumbnailId: string;
  videoId: string;
  userId: string;
  timestamp: number;
  size?: string;
  createdAt: string;
}

export interface StocksSyncMessage {
  jobId: string;
  companyId: string;
  ticker: string;
  cik: string;
}

/**
 * Handle stocks sync messages
 */
export async function handleStocksSyncMessage(
  message: StocksSyncMessage
): Promise<void> {
  logger.info(
    { jobId: message.jobId, ticker: message.ticker },
    '📈 Processing stocks sync job'
  );

  try {
    const { secAdapter } = await import('../adapters/secAdapter.js');
    const { stocksRepo } = await import('../modules/stocks/stocks.repo.js');

    // Update job status to processing
    await stocksRepo.updateJobRun(message.jobId, { status: 'running' });

    // Fetch SEC data
    logger.info(
      { cik: message.cik, ticker: message.ticker },
      'Fetching SEC company facts'
    );
    const facts = await secAdapter.getCompanyFacts(message.cik, false);

    if (!facts) {
      throw new Error('Failed to fetch SEC company facts');
    }

    // Parse fundamentals
    const fundamentals = secAdapter.parseFundamentals(facts);
    logger.info(
      { ticker: message.ticker, count: fundamentals.length },
      'Parsed SEC fundamentals'
    );

    // Upsert to database
    let upsertCount = 0;
    for (const fund of fundamentals) {
      await stocksRepo.upsertFundamentals({
        companyId: message.companyId,
        periodType: fund.periodType,
        periodEnd: fund.periodEnd,
        revenue: fund.revenue || undefined,
        netIncome: fund.netIncome || undefined,
        assets: fund.assets || undefined,
        liabilities: fund.liabilities || undefined,
        equity: fund.equity || undefined,
        cfo: fund.cfo || undefined,
      });
      upsertCount++;
    }

    // Update job status to completed
    await stocksRepo.updateJobRun(message.jobId, { status: 'success' });

    logger.info(
      { jobId: message.jobId, ticker: message.ticker, upserted: upsertCount },
      '✅ Stocks sync completed'
    );
  } catch (error) {
    logger.error({ error, jobId: message.jobId }, '❌ Stocks sync failed');

    // Update job status to failed
    const { stocksRepo } = await import('../modules/stocks/stocks.repo.js');
    await stocksRepo.updateJobRun(message.jobId, {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}

/**
 * Handle task messages from RabbitMQ
 */
export async function handleTaskMessage(message: TaskMessage): Promise<void> {
  logger.info(
    { taskId: message.taskId, taskType: message.taskType },
    '📋 Processing task from RabbitMQ'
  );

  try {
    // ========================================
    // YOUR TASK PROCESSING LOGIC HERE
    // ========================================

    switch (message.taskType) {
      case 'video-processing':
        logger.info('Processing video task...');
        // Add your video processing logic
        break;

      case 'thumbnail-generation':
        logger.info('Generating thumbnail...');
        // Add your thumbnail generation logic
        break;

      case 'email-notification':
        logger.info('Sending email notification...');
        // Add your email logic
        break;

      default:
        logger.warn({ taskType: message.taskType }, 'Unknown task type');
    }

    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 1000));

    logger.info({ taskId: message.taskId }, '✅ Task completed');
  } catch (error) {
    logger.error(
      { error, taskId: message.taskId },
      '❌ Task processing failed'
    );
    throw error;
  }
}

/**
 * Handle video upload messages from RabbitMQ
 */
export async function handleVideoMessage(message: VideoMessage): Promise<void> {
  logger.info(
    { videoId: message.videoId },
    '🎥 Processing video upload from RabbitMQ'
  );

  try {
    // ========================================
    // YOUR VIDEO PROCESSING LOGIC HERE
    // ========================================

    logger.info({ url: message.url }, 'Video URL received');

    // Example: Validate video, extract metadata, generate thumbnails
    // await validateVideo(message.url);
    // await extractMetadata(message.videoId);
    // await generateThumbnails(message.videoId);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    logger.info({ videoId: message.videoId }, '✅ Video processed');
  } catch (error) {
    logger.error(
      { error, videoId: message.videoId },
      '❌ Video processing failed'
    );
    throw error;
  }
}

/**
 * Handle thumbnail generation messages from RabbitMQ
 */
export async function handleThumbnailMessage(
  message: ThumbnailMessage
): Promise<void> {
  logger.info(
    { thumbnailId: message.thumbnailId, videoId: message.videoId },
    '🖼️  Processing thumbnail generation from RabbitMQ'
  );

  try {
    // ========================================
    // YOUR THUMBNAIL PROCESSING LOGIC HERE
    // ========================================

    logger.info(
      { timestamp: message.timestamp, size: message.size },
      'Generating thumbnail at timestamp'
    );

    // Example: Extract frame at timestamp, resize, save to storage
    // await extractFrame(message.videoId, message.timestamp);
    // await resizeThumbnail(message.thumbnailId, message.size);
    // await saveThumbnail(message.thumbnailId);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    logger.info({ thumbnailId: message.thumbnailId }, '✅ Thumbnail generated');
  } catch (error) {
    logger.error(
      { error, thumbnailId: message.thumbnailId },
      '❌ Thumbnail generation failed'
    );
    throw error;
  }
}
