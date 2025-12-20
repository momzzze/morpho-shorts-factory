FROM node:22-alpine

WORKDIR /app

COPY apps/api/package.json apps/api/pnpm-lock.yaml ./

RUN corepack enable && pnpm install --frozen-lockfile

COPY apps/api/src ./src
COPY apps/api/tsconfig.json ./tsconfig.json

RUN pnpm build

EXPOSE 5001

CMD ["node", "dist/index.js"]