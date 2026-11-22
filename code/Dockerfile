# Production Multi-Stage Dockerfile for Deutschly
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache python3 py3-pip libc6-compat
ENV PYTHONUNBUFFERED=1

# Dependencies stage
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma/
RUN npm ci

# Builder stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Runner stage
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Install runtime python dependencies for TTS and simplemma
RUN pip3 install --no-cache-dir --break-system-packages gTTS simplemma

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

# Ensure cache directory is writable
RUN mkdir -p public/audio_cache && chown -R nextjs:nodejs public/audio_cache

USER nextjs
EXPOSE 3000

CMD ["npm", "start"]
