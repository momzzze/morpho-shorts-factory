FROM node:22-alpine

WORKDIR /app

COPY apps/api/package.json apps/api/pnpm-lock.yaml ./

RUN corepack enable && pnpm install --frozen-lockfile

COPY apps/api/src ./src
COPY apps/api/tsconfig.json ./tsconfig.json
COPY apps/api/prisma ./prisma
COPY apps/api/prisma.config.ts ./prisma.config.ts

# Generate Prisma Client
RUN pnpm db:generate

RUN pnpm build

EXPOSE 5001

# Use the start script from package.json which handles db push with retry logic
CMD ["pnpm", "start"]