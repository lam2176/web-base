# syntax = docker/dockerfile:1

# Same major version as local development
ARG NODE_VERSION=22.14.0
FROM node:${NODE_VERSION}-slim AS base

# NestJS app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"


# Throw-away build stage to reduce size of final image
FROM base AS build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

# Install node modules
COPY package-lock.json package.json ./
RUN npm ci --include=dev

# Copy application code
COPY . .

# Build application (output: dist/src/main.js, locales copied to dist/src/locales)
RUN npm run build


# Final stage for app image
FROM base

# Install only production dependencies
COPY package-lock.json package.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application from build stage
COPY --from=build /app/dist ./dist

# The file logger writes to ./logs; run as the unprivileged node user
RUN mkdir -p logs && chown -R node:node /app
USER node

ENV PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD [ "node", "dist/src/main.js" ]
