-- Run this ONCE in Railway's PostgreSQL query console to fix the failed migration
-- This clears the failed migration record so Prisma can retry it

-- Option 1: Delete the failed migration record (simplest)
DELETE FROM _prisma_migrations WHERE migration_name = '20251227211141_init';

-- After running this, your app will automatically run the migration successfully on next deploy
