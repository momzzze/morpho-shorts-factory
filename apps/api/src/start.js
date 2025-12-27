import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const MAX_RETRIES = 30;
const RETRY_DELAY = 2000; // 2 seconds

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function resolveFailedMigrations() {
  try {
    console.log('🔍 Checking for failed migrations...');
    const { stdout } = await execAsync('npx prisma migrate status');
    
    if (stdout.includes('failed') || stdout.includes('Failed')) {
      console.log('⚠️  Found failed migration, attempting to resolve...');
      
      // Mark failed migration as rolled back so we can retry
      const { stdout: resolveOut } = await execAsync(
        'npx prisma migrate resolve --rolled-back 20251227211141_init'
      );
      console.log(resolveOut);
      console.log('✅ Failed migration marked as rolled back');
      return true;
    }
  } catch (error) {
    console.log('ℹ️  No failed migrations to resolve or database not ready yet');
  }
  return false;
}

async function runMigrations() {
  console.log('🚀 Starting deployment...');
  console.log('⏳ Waiting for database connection...');

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${MAX_RETRIES} - Running migrations...`);
      
      // First try to resolve any failed migrations
      if (attempt === 1) {
        await resolveFailedMigrations();
      }
      
      const { stdout, stderr } = await execAsync('npx prisma migrate deploy');

      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);

      console.log('✅ Database migrations completed successfully');
      return true;
    } catch (error) {
      console.error(`⚠️  Migration attempt ${attempt} failed:`, error.message);
      
      // Check if it's a P3009 error (failed migration detected)
      if (error.message.includes('P3009')) {
        console.log('🔧 Detected failed migration, resolving...');
        await resolveFailedMigrations();
      }

      if (attempt < MAX_RETRIES) {
        console.log(`Waiting ${RETRY_DELAY / 1000} seconds before retry...`);
        await sleep(RETRY_DELAY);
      }
    }
  }

  console.error(`❌ Failed to run migrations after ${MAX_RETRIES} attempts`);
  console.log(
    '⚠️  Starting application anyway (migrations can be run manually)'
  );
  return false;
}

async function startApp() {
  await runMigrations();

  console.log('🎯 Starting application...');

  // Import and start the actual application
  await import('./index.js');
}

startApp().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});
