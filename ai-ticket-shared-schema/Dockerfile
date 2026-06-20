FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json tsconfig.json ./
RUN npm install
COPY src/ ./src/
RUN npm run build

FROM scratch
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
