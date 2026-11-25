FROM node:20-alpine AS deps

WORKDIR /app

# Install dependencies with cache layer
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:20-alpine AS runner

ENV NODE_ENV=production
ENV TZ=UTC

WORKDIR /app

# Non-root user
RUN addgroup -S bot && adduser -S bot -G bot

COPY --from=deps --chown=bot:bot /app/node_modules ./node_modules
COPY --chown=bot:bot package.json ./
COPY --chown=bot:bot src ./src

# Data directory (mounted as volume in compose)
RUN mkdir -p /app/data && chown -R bot:bot /app/data

USER bot

CMD ["node", "src/index.js"]