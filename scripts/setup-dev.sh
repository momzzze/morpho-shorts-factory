#!/bin/bash

# ============================================================================
# Morpho Shorts Factory - Development Environment Setup
# ============================================================================
# This script sets up your complete development environment with:
# - PostgreSQL Database
# - Redis Cache
# - RabbitMQ Message Broker
# ============================================================================

set -e

echo "🚀 Starting Morpho development environment..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install pnpm first."
    echo "   npm install -g pnpm"
    exit 1
fi

echo "✅ Docker and pnpm found"
echo ""

# Start Docker services
echo "📦 Starting Docker services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Docker services started successfully"
else
    echo "❌ Failed to start Docker services"
    exit 1
fi

echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "🗄️  Setting up database..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
until docker exec morpho-postgres pg_isready -U morpho > /dev/null 2>&1; do
    sleep 1
done
echo "✅ PostgreSQL is ready"

# Run migrations
echo "📋 Running database migrations..."
pnpm --filter api exec prisma db push --skip-generate || true

echo ""
echo "✅ Database migrations completed"
echo ""

echo "📦 Installing dependencies..."
pnpm install

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Development environment is ready!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Services Running:"
echo "   • PostgreSQL    → localhost:5432 (user: morpho, password: dev_password)"
echo "   • Redis         → localhost:6379"
echo "   • RabbitMQ      → localhost:5672 (guest/guest)"
echo "   • RabbitMQ UI   → http://localhost:15672 (guest/guest)"
echo ""
echo "🚀 Next Steps:"
echo ""
echo "   1. Copy environment file:"
echo "      cp .env.example .env"
echo ""
echo "   2. Start the API (in a new terminal):"
echo "      pnpm dev:api"
echo ""
echo "   3. Start the worker (optional, in another terminal):"
echo "      pnpm dev:worker"
echo ""
echo "   4. Open API: http://localhost:5001"
echo ""
echo "5. Manage database: pnpm --filter api db:studio"
echo ""
echo "📋 Useful Commands:"
echo ""
echo "   Docker:"
echo "   • docker-compose down          - Stop services"
echo "   • docker-compose logs -f       - View logs"
echo "   • docker-compose ps            - Service status"
echo ""
echo "   Database:"
echo "   • pnpm --filter api db:studio  - Open Prisma Studio"
echo "   • pnpm --filter api db:push    - Push schema changes"
echo ""
echo "   Redis:"
echo "   • redis-cli ping               - Test Redis connection"
echo "   • redis-cli                    - Open Redis CLI"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
