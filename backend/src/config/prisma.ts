import { PrismaClient } from '@prisma/client';
import { env } from './env.js';
import { logger } from './logger.js';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Guard against re-entrancy: doing async work inside a `beforeExit` handler lets
// the event loop drain and fire `beforeExit` again, which would loop forever.
let hasDisconnected = false;
process.on('beforeExit', async () => {
  if (hasDisconnected) return;
  hasDisconnected = true;
  await prisma.$disconnect();
  logger.info('Prisma disconnected.');
});

