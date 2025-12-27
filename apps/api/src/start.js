import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const MAX_RETRIES = 30;
const RETRY_DELAY = 2000; // 2 seconds

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function resolveFailedMigration(migrationName) {
  try {
    console.log(`🔧 Resolving failed migration: ${migrationName}`);

    const { stdout } = await execAsync(
      `npx prisma migrate resolve --rolled-back "${migrationName}"`
    );
    console.log(stdout);
    console.log('✅ Failed migration marked as rolled back, will retry');
    return true;
  } catch (error) {
    console.error('⚠️  Failed to resolve migration:', error.message);
    return false;
  }
}

async function runMigrations() {
  console.log('🚀 Starting deployment...');
  console.log('⏳ Waiting for database connection...');

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(
        `Attempt ${attempt}/${MAX_RETRIES} - Syncing database schema...`
      );

      // Use db push for Railway (simpler, no migration history issues)
      const command = 'npx prisma db push --accept-data-loss';

      console.log(`Running: ${command}`);
      const { stdout, stderr } = await execAsync(command);

      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);

      console.log('✅ Database schema synchronized successfully');
      return true;
    } catch (error) {
      // Combine all error outputs to check for P3009
      const errorOutput = [error.stderr, error.stdout, error.message]
        .filter(Boolean)
        .join('\n');

      console.error(`⚠️  Attempt ${attempt} failed`);
      console.error(errorOutput);

      if (attempt < MAX_RETRIES) {
        console.log(`Waiting ${RETRY_DELAY / 1000} seconds before retry...`);
        await sleep(RETRY_DELAY);
      }
    }
  }

  console.error(`❌ Failed to sync database after ${MAX_RETRIES} attempts`);
  console.log(
    '⚠️  Starting application anyway (schema can be synced manually)'
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
