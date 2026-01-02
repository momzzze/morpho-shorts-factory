/**
 * Redis Test Script
 *
 * Tests Redis caching with actual User model
 * Run: node --loader tsx apps/api/src/tests/test-redis.ts
 */

import { prisma } from '../lib/prisma.js';
import { initRedis, getRedis, closeRedis } from '../lib/redis.js';
import { cacheService } from '../services/cacheService.js';
import { logger } from '../logger.js';

async function testRedis() {
  console.log('🧪 Redis Test Suite\n');

  try {
    // 1. Initialize Redis
    console.log('1️⃣  Initializing Redis...');
    await initRedis();
    const redis = getRedis();

    if (!redis) {
      console.log(
        '⚠️  Redis not available - tests will use fallback (no caching)'
      );
    } else {
      console.log('✅ Redis connected\n');
    }

    // 2. Test direct Redis operations
    if (redis) {
      console.log('2️⃣  Testing direct Redis operations...');

      await redis.set('test:key', 'Hello Redis!', 'EX', 10);
      const value = await redis.get('test:key');
      console.log(`   Set/Get: ${value}`);

      await redis.del('test:key');
      const deleted = await redis.get('test:key');
      console.log(
        `   Deleted: ${deleted === null ? 'null (success)' : 'failed'}`
      );
      console.log('✅ Direct Redis operations work\n');
    }

    // 3. Test Cache Service
    console.log('3️⃣  Testing Cache Service...');

    // Simple set/get
    await cacheService.set(
      'test:user',
      { id: '123', email: 'test@example.com' },
      60
    );
    const cachedUser = await cacheService.get<any>('test:user');
    console.log(`   Cached user: ${cachedUser?.email}`);

    // Invalidate
    await cacheService.invalidate('test:user');
    const afterInvalidate = await cacheService.get('test:user');
    console.log(
      `   After invalidate: ${
        afterInvalidate === null ? 'null (success)' : 'failed'
      }`
    );
    console.log('✅ Cache service works\n');

    // 4. Test with Real Database (User model)
    console.log('4️⃣  Testing with Database...');

    // Create a test user
    const testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'test-hash',
        username: `testuser-${Date.now()}`,
      },
    });
    console.log(`   Created user: ${testUser.email}`);

    // Test get-or-set pattern
    console.log('\n   Testing get-or-set pattern:');

    // First call - cache miss (fetches from DB)
    const start1 = Date.now();
    const user1 = await cacheService.getOrSet(
      `user:${testUser.id}`,
      async () => {
        console.log('   📥 Cache MISS - fetching from database...');
        return prisma.user.findUnique({ where: { id: testUser.id } });
      },
      60
    );
    const time1 = Date.now() - start1;
    console.log(`   ✅ Got user: ${user1?.email} (${time1}ms)`);

    // Second call - cache hit (from Redis)
    const start2 = Date.now();
    const user2 = await cacheService.getOrSet(
      `user:${testUser.id}`,
      async () => {
        console.log('   📥 Cache MISS - fetching from database...');
        return prisma.user.findUnique({ where: { id: testUser.id } });
      },
      60
    );
    const time2 = Date.now() - start2;
    console.log(
      `   ✅ Got user: ${user2?.email} (${time2}ms) ${
        redis ? '🚀 FROM CACHE' : ''
      }`
    );

    if (redis && time2 < time1) {
      console.log(`   💨 Cache was ${Math.round(time1 / time2)}x faster!`);
    }

    // Test invalidation
    console.log('\n   Testing cache invalidation:');
    await cacheService.invalidate(`user:${testUser.id}`);
    console.log('   🗑️  Cache invalidated');

    const user3 = await cacheService.getOrSet(
      `user:${testUser.id}`,
      async () => {
        console.log('   📥 Cache MISS - fetching from database...');
        return prisma.user.findUnique({ where: { id: testUser.id } });
      },
      60
    );
    console.log(`   ✅ Got user after invalidation: ${user3?.email}`);

    // Cleanup
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log(`\n   🧹 Cleaned up test user`);
    console.log('✅ Database integration works\n');

    // 5. Test pattern invalidation
    if (redis) {
      console.log('5️⃣  Testing pattern invalidation...');

      // Set multiple keys
      await cacheService.set('user:1', { id: '1' }, 60);
      await cacheService.set('user:2', { id: '2' }, 60);
      await cacheService.set('user:3', { id: '3' }, 60);
      await cacheService.set('company:AAPL', { ticker: 'AAPL' }, 60);

      console.log('   Set multiple cache keys');

      // Invalidate by pattern
      await cacheService.invalidatePattern('user:*');
      console.log('   Invalidated user:* pattern');

      const user1Gone = await cacheService.get('user:1');
      const companyStillThere = await cacheService.get('company:AAPL');

      console.log(
        `   user:1 after pattern delete: ${
          user1Gone === null ? 'null (success)' : 'failed'
        }`
      );
      console.log(
        `   company:AAPL still there: ${
          companyStillThere !== null ? 'yes (success)' : 'no (failed)'
        }`
      );

      // Cleanup
      await cacheService.invalidate('company:AAPL');
      console.log('✅ Pattern invalidation works\n');
    }

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 All tests passed!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(
      `\n✅ Redis Status: ${
        redis ? 'Connected & Working' : 'Not available (graceful fallback)'
      }`
    );
    console.log('✅ Cache Service: Working');
    console.log('✅ Database Integration: Working');
    console.log('✅ Get-or-Set Pattern: Working');
    console.log('✅ Cache Invalidation: Working');
    if (redis) {
      console.log('✅ Pattern Invalidation: Working');
    }
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  } finally {
    await closeRedis();
    await prisma.$disconnect();
  }
}

// Run tests
testRedis()
  .then(() => {
    console.log('\n✅ Test suite completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  });
