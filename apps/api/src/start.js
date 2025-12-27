import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const MAX_RETRIES = 30;
const RETRY_DELAY = 2000; // 2 seconds

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runMigrations() {
  console.log('🚀 Starting deployment...');
  console.log('⏳ Waiting for database connection...');

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${MAX_RETRIES} - Running migrations...`);
      const { stdout, stderr } = await execAsync('npx prisma migrate deploy');

      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);

      console.log('✅ Database migrations completed successfully');
      return true;
    } catch (error) {
      console.error(`⚠️  Migration attempt ${attempt} failed:`, error.message);

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
