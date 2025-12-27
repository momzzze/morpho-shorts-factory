#!/usr/bin/env node
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const checks = [
  {
    name: 'TypeScript compilation',
    command: 'pnpm tsc --noEmit',
    critical: true,
  },
  {
    name: 'Prisma schema validation',
    command: 'pnpm prisma validate',
    critical: true,
  },
  {
    name: 'Prisma client generation',
    command: 'pnpm db:generate',
    critical: true,
  },
  {
    name: 'Environment variables',
    command: 'node -e "require(\'./src/env.js\')"',
    critical: false,
  },
];

async function runCheck(check) {
  try {
    console.log(`\n🔍 Checking: ${check.name}...`);
    const { stdout, stderr } = await execAsync(check.command);
    if (stdout) console.log(stdout);
    if (stderr && !stderr.includes('warning')) console.error(stderr);
    console.log(`✅ ${check.name} passed`);
    return true;
  } catch (error) {
    console.error(`❌ ${check.name} failed:`);
    console.error(error.message);
    return !check.critical;
  }
}

async function main() {
  console.log('🚀 Running pre-deployment checks...\n');

  let allPassed = true;
  for (const check of checks) {
    const passed = await runCheck(check);
    if (!passed) allPassed = false;
  }

  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✅ All checks passed! Safe to deploy.');
    process.exit(0);
  } else {
    console.log('❌ Some checks failed. Fix issues before deploying.');
    process.exit(1);
  }
}

main();
