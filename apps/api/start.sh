#!/bin/sh
set -e

echo "🚀 Starting deployment..."

# Wait for database to be ready with retries
echo "⏳ Waiting for database connection..."
MAX_RETRIES=30
RETRY_COUNT=0

until npx prisma migrate deploy || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
  RETRY_COUNT=$((RETRY_COUNT+1))
  echo "⚠️  Database not ready yet (attempt $RETRY_COUNT/$MAX_RETRIES), waiting 2 seconds..."
  sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "❌ Failed to connect to database after $MAX_RETRIES attempts"
  echo "⚠️  Starting application anyway (migrations can be run manually later)"
else
  echo "✅ Database migrations completed successfully"
fi

# Start the application
echo "🎯 Starting application..."
exec node dist/index.js
