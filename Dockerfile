# Multi-stage Dockerfile für optimierte Production Build

# Basis-Image für alle Stages
FROM node:22-alpine AS base

# Installiere Dependencies die für native Module und Health Checks benötigt werden
RUN apk add --no-cache libc6-compat wget

# Erstelle und setze working directory
WORKDIR /app

# Stage 1: Dependencies installieren
FROM base AS deps
# Copy package files
COPY package.json package-lock.json* ./
# Installiere Dependencies
RUN npm ci

# Stage 2: Builder für die App
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Erstelle .env.local falls nicht vorhanden (für Build)
RUN touch .env.local

# Baue die Application
RUN npm run build

# Stage 3: Production Image
FROM base AS runner
WORKDIR /app

# Erstelle non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Kopiere nur die nötigen Files für Production
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Kopiere built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Erstelle uploads directory und setze Berechtigungen
RUN mkdir -p /app/public/uploads
RUN chown -R nextjs:nodejs /app/public/uploads
RUN chmod -R 755 /app/public/uploads

# Erstelle data directory für JSON files
RUN mkdir -p /app/data
RUN chown -R nextjs:nodejs /app/data
RUN chmod -R 755 /app/data

# Erstelle temp directory
RUN mkdir -p /app/temp
RUN chown -R nextjs:nodejs /app/temp
RUN chmod -R 755 /app/temp

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "server.js"]
