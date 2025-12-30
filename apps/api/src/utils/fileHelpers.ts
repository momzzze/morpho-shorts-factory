import fs from 'fs';
import path from 'path';
import { logger } from '../logger.js';

/**
 * Utility functions for file and directory management
 */

/**
 * Ensure directory exists, create if not
 */
export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    logger.debug({ dirPath }, 'Created directory');
  }
}

/**
 * Delete file if exists
 */
export function deleteFile(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    logger.debug({ filePath }, 'Deleted file');
  }
}

/**
 * Delete directory and all contents
 */
export function deleteDirectory(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    logger.debug({ dirPath }, 'Deleted directory');
  }
}

/**
 * Get file size in bytes
 */
export function getFileSize(filePath: string): number {
  if (!fs.existsSync(filePath)) {
    return 0;
  }
  const stats = fs.statSync(filePath);
  return stats.size;
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Generate unique filename with timestamp
 */
export function generateUniqueFilename(
  prefix: string = 'file',
  extension: string = 'mp4'
): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}_${timestamp}_${random}.${extension}`;
}

/**
 * Get list of files in directory
 */
export function getFilesInDirectory(
  dirPath: string,
  extension?: string
): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  let files = fs.readdirSync(dirPath);

  if (extension) {
    files = files.filter((file) => file.endsWith(extension));
  }

  return files.map((file) => path.join(dirPath, file));
}

/**
 * Create temp directory for user
 */
export function createUserTempDir(userId: string): string {
  const tempDir = path.join(process.cwd(), 'temp', userId);
  ensureDir(tempDir);
  return tempDir;
}

/**
 * Clean up user temp directory
 */
export function cleanupUserTempDir(userId: string): void {
  const tempDir = path.join(process.cwd(), 'temp', userId);
  deleteDirectory(tempDir);
}

/**
 * Extract video ID from TikTok URL
 */
export function extractTikTokVideoId(url: string): string | null {
  // Match patterns like:
  // https://www.tiktok.com/@username/video/1234567890
  // https://vm.tiktok.com/ZMLNnhFSe/
  // https://vt.tiktok.com/ZMLNnhFSe/

  const patterns = [
    /tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
    /vm\.tiktok\.com\/([A-Za-z0-9]+)/,
    /vt\.tiktok\.com\/([A-Za-z0-9]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Validate TikTok URL format
 */
export function isValidTikTokUrl(url: string): boolean {
  const tiktokUrlPattern =
    /^https?:\/\/(www\.)?(tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com)/;
  return tiktokUrlPattern.test(url);
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const delay = initialDelay * Math.pow(2, attempt);

      logger.warn(
        { attempt: attempt + 1, maxRetries, delay, error },
        'Retry attempt failed'
      );

      if (attempt < maxRetries - 1) {
        await sleep(delay);
      }
    }
  }

  throw lastError;
}
