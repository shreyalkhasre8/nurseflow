# Stage 1: Build Frontend SPA
FROM node:20-alpine AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

# Stage 2: Production Server
FROM node:20-alpine AS runner
WORKDIR /app

# Install native dependencies required for better-sqlite3 compilation
RUN apk add --no-cache python3 make g++

ENV NODE_ENV=production
ENV PORT=5000

# Install server dependencies
COPY package*.json tsconfig*.json ./
RUN npm ci

# Copy server source and built frontend distribution
COPY server/ ./server/
COPY --from=client-builder /app/client/dist ./client/dist

# Persistent volume for SQLite database storage
RUN mkdir -p /app/data
VOLUME ["/app/data"]

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

CMD ["npx", "tsx", "server/index.ts"]
