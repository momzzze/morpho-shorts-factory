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
      console.log(`Attempt ${attempt}/${MAX_RETRIES} - Running migrations...`);

      const { stdout, stderr } = await execAsync('npx prisma migrate deploy');

      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);

      console.log('✅ Database migrations completed successfully');
      return true;
    } catch (error) {
      // Combine all error outputs to check for P3009
      const errorOutput = [error.stderr, error.stdout, error.message]
        .filter(Boolean)
        .join('\n');

      console.error(`⚠️  Migration attempt ${attempt} failed`);
      console.error(errorOutput);

      // Check if it's a P3009 error (failed migration detected)
      if (
        errorOutput.includes('P3009') ||
        errorOutput.includes('failed migrations')
      ) {
        console.log('🔍 Detected P3009: Failed migration in database');

        // Extract migration name - look for pattern like `20251227211141_init`
        const migrationMatch = errorOutput.match(/`([0-9_a-z]+)`.*?failed/i);
        if (migrationMatch && migrationMatch[1]) {
          const migrationName = migrationMatch[1];
          console.log(`📝 Found migration name: ${migrationName}`);
          const resolved = await resolveFailedMigration(migrationName);

          if (resolved) {
            console.log('♻️  Retrying migration immediately...');
            // Don't increment attempt counter or wait - just retry
            continue;
          }
        } else {
          console.error('❌ Could not extract migration name from error');
          console.error('Full error output:', errorOutput);
        }
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
