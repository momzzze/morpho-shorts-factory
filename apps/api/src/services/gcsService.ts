import { Storage } from '@google-cloud/storage';
import { env } from '../env.js';
import { logger } from '../logger.js';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

export class GCSService {
  private storage: Storage;
  private bucketName: string;

  constructor() {
    if (env.STORAGE_DRIVER !== 'gcs') {
      throw new Error('GCS storage driver is not enabled in environment');
    }

    if (!env.GCS_PROJECT_ID || !env.GCS_BUCKET_NAME) {
      throw new Error(
        'GCS_PROJECT_ID and GCS_BUCKET_NAME are required when STORAGE_DRIVER=gcs'
      );
    }

    // Initialize storage with credentials
    const storageOptions: any = {
      projectId: env.GCS_PROJECT_ID,
    };

    // If credentials path is provided, use it
    if (env.GCS_CREDENTIALS_PATH) {
      storageOptions.keyFilename = env.GCS_CREDENTIALS_PATH;
    }
    // Otherwise, use Application Default Credentials (gcloud auth)

    this.storage = new Storage(storageOptions);
    this.bucketName = env.GCS_BUCKET_NAME;

    logger.info({ bucketName: this.bucketName }, 'GCS Service initialized');
  }

  /**
   * Upload a file to GCS
   * @param localFilePath - Path to the local file
   * @param destinationPath - Destination path in GCS bucket (e.g., 'videos/video-123.mp4')
   * @returns Public URL of the uploaded file
   */
  async uploadFile(
    localFilePath: string,
    destinationPath: string
  ): Promise<string> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(destinationPath);

      await bucket.upload(localFilePath, {
        destination: destinationPath,
        metadata: {
          cacheControl: 'public, max-age=31536000',
        },
      });

      logger.info(
        { localFilePath, destinationPath, bucket: this.bucketName },
        'File uploaded to GCS'
      );

      // Return public URL
      return `https://storage.googleapis.com/${this.bucketName}/${destinationPath}`;
    } catch (error) {
      logger.error(
        { error, localFilePath, destinationPath },
        'Failed to upload file to GCS'
      );
      throw error;
    }
  }

  /**
   * Upload from stream (direct upload without local storage)
   * @param stream - Readable stream (e.g., from axios response)
   * @param destinationPath - Destination path in GCS bucket
   * @param contentType - MIME type of the file
   * @returns Public URL of the uploaded file
   */
  async uploadFromStream(
    stream: Readable,
    destinationPath: string,
    contentType: string = 'video/mp4'
  ): Promise<string> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(destinationPath);

      await new Promise<void>((resolve, reject) => {
        stream
          .pipe(
            file.createWriteStream({
              metadata: {
                contentType,
                cacheControl: 'public, max-age=31536000',
              },
            })
          )
          .on('error', reject)
          .on('finish', resolve);
      });

      logger.info(
        { destinationPath, bucket: this.bucketName },
        'Stream uploaded to GCS'
      );

      return `https://storage.googleapis.com/${this.bucketName}/${destinationPath}`;
    } catch (error: any) {
      logger.error(
        {
          error: error.message || error,
          stack: error.stack,
          code: error.code,
          destinationPath,
        },
        'Failed to upload stream to GCS'
      );
      throw error;
    }
  }

  /**
   * Download a file from GCS
   * @param sourcePath - Path to file in GCS bucket
   * @param destinationPath - Local destination path
   */
  async downloadFile(
    sourcePath: string,
    destinationPath: string
  ): Promise<void> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(sourcePath);

      // Ensure destination directory exists
      const dir = path.dirname(destinationPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      await file.download({ destination: destinationPath });

      logger.info(
        { sourcePath, destinationPath, bucket: this.bucketName },
        'File downloaded from GCS'
      );
    } catch (error) {
      logger.error(
        { error, sourcePath, destinationPath },
        'Failed to download file from GCS'
      );
      throw error;
    }
  }

  /**
   * Delete a file from GCS
   * @param filePath - Path to file in GCS bucket
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(filePath);

      await file.delete();

      logger.info(
        { filePath, bucket: this.bucketName },
        'File deleted from GCS'
      );
    } catch (error) {
      logger.error({ error, filePath }, 'Failed to delete file from GCS');
      throw error;
    }
  }

  /**
   * List all files in a directory (prefix)
   * @param prefix - Directory prefix (e.g., 'videos/')
   * @returns Array of file paths
   */
  async listFiles(prefix: string = ''): Promise<string[]> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const [files] = await bucket.getFiles({ prefix });

      const filePaths = files.map((file) => file.name);

      logger.info({ prefix, count: filePaths.length }, 'Listed files from GCS');

      return filePaths;
    } catch (error) {
      logger.error({ error, prefix }, 'Failed to list files from GCS');
      throw error;
    }
  }

  // ============================================================================
  // User Folder Helpers for Video Compilation Workflow
  // ============================================================================

  /**
   * Get user's base folder path
   * @param username - User's unique username
   * @returns Base path for user (e.g., "users/john123")
   */
  getUserFolder(username: string): string {
    return `users/${username}`;
  }

  /**
   * Get user's temp folder for scraped videos
   * @param username - User's unique username
   * @returns Temp folder path (e.g., "users/john123/temp")
   */
  getUserTempFolder(username: string): string {
    return `${this.getUserFolder(username)}/temp`;
  }

  /**
   * Get user's compilations folder for final videos
   * @param username - User's unique username
   * @returns Compilations folder path (e.g., "users/john123/compilations")
   */
  getUserCompilationsFolder(username: string): string {
    return `${this.getUserFolder(username)}/compilations`;
  }

  /**
   * Upload a scraped TikTok video stream directly to GCS (no local storage)
   * @param username - User's unique username
   * @param stream - Video stream from TikTok
   * @param fileName - Filename (e.g., "video1.mp4")
   * @returns GCS URL and path
   */
  async uploadScrapedVideoStream(
    username: string,
    stream: Readable,
    fileName: string
  ): Promise<{ url: string; gcsPath: string }> {
    const gcsPath = `${this.getUserTempFolder(username)}/${fileName}`;
    const url = await this.uploadFromStream(stream, gcsPath, 'video/mp4');

    logger.info(
      { username, fileName, gcsPath },
      'Uploaded scraped video from stream'
    );

    return { url, gcsPath };
  }

  /**
   * Upload a scraped TikTok video to user's temp folder (legacy - uses local file)
   * @param username - User's unique username
   * @param localFilePath - Local path to scraped video
   * @param fileName - Filename (e.g., "video1.mp4")
   * @returns GCS URL
   */
  async uploadScrapedVideo(
    username: string,
    localFilePath: string,
    fileName: string
  ): Promise<{ url: string; gcsPath: string }> {
    const gcsPath = `${this.getUserTempFolder(username)}/${fileName}`;
    const url = await this.uploadFile(localFilePath, gcsPath);

    logger.info({ username, fileName, gcsPath }, 'Uploaded scraped video');

    return { url, gcsPath };
  }

  /**
   * Upload final compilation video
   * @param username - User's unique username
   * @param localFilePath - Local path to final video
   * @param videoId - Video ID for naming
   * @returns GCS URL and path
   */
  async uploadCompilation(
    username: string,
    localFilePath: string,
    videoId: string
  ): Promise<{ url: string; gcsPath: string }> {
    const fileName = `top5-${videoId}.mp4`;
    const gcsPath = `${this.getUserCompilationsFolder(username)}/${fileName}`;
    const url = await this.uploadFile(localFilePath, gcsPath);

    logger.info({ username, videoId, gcsPath }, 'Uploaded compilation video');

    return { url, gcsPath };
  }

  /**
   * Clean up all temp files in user's temp folder
   * @param username - User's unique username
   * @returns Number of files deleted
   */
  async cleanupUserTemp(username: string): Promise<number> {
    try {
      const tempFolder = this.getUserTempFolder(username);
      const files = await this.listFiles(tempFolder);

      // Delete all files in temp folder
      await Promise.all(files.map((file) => this.deleteFile(file)));

      logger.info(
        { username, deletedCount: files.length },
        'Cleaned up user temp folder'
      );

      return files.length;
    } catch (error) {
      logger.error({ error, username }, 'Failed to cleanup user temp folder');
      throw error;
    }
  }

  /**
   * Delete entire user folder (all data)
   * @param username - User's unique username
   * @returns Number of files deleted
   */
  async deleteUserFolder(username: string): Promise<number> {
    try {
      const userFolder = this.getUserFolder(username);
      const files = await this.listFiles(userFolder);

      // Delete all files in user folder
      await Promise.all(files.map((file) => this.deleteFile(file)));

      logger.info(
        { username, deletedCount: files.length },
        'Deleted user folder'
      );

      return files.length;
    } catch (error) {
      logger.error({ error, username }, 'Failed to delete user folder');
      throw error;
    }
  }
}

// Export singleton instance (only if GCS is enabled)
export const gcsService =
  env.STORAGE_DRIVER === 'gcs' ? new GCSService() : null;
