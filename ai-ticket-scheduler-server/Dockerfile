# NOTE: This Dockerfile must be built from the monorepo root so that the
# COPY ../ai-ticket-shared-* paths resolve correctly.
#   docker build -f ai-ticket-scheduler-server/Dockerfile -t scheduler-server .

FROM node:20-alpine AS builder
WORKDIR /app

# Copy shared packages first — required by file: dependencies.
COPY ai-ticket-shared-lib/package.json ./ai-ticket-shared-lib/
COPY ai-ticket-shared-lib/tsconfig.json ./ai-ticket-shared-lib/
COPY ai-ticket-shared-lib/src/ ./ai-ticket-shared-lib/src/

COPY ai-ticket-shared-schema/package.json ./ai-ticket-shared-schema/
COPY ai-ticket-shared-schema/tsconfig.json ./ai-ticket-shared-schema/
COPY ai-ticket-shared-schema/src/ ./ai-ticket-shared-schema/src/

COPY ai-ticket-scheduler-server/package.json ai-ticket-scheduler-server/tsconfig.json ./
RUN npm install --install-strategy=nested
COPY ai-ticket-scheduler-server/src/ ./src/
RUN npm run build

FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

USER node

EXPOSE 3004
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3004/health', r => process.exit(r.statusCode===200?0:1))"

CMD ["node", "dist/index.js"]
