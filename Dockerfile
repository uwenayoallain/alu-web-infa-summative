FROM node:20.11.1-alpine3.19

# Set working directory
WORKDIR /app

# Install dumb-init for proper signal handling and security updates
RUN apk add --no-cache dumb-init && \
    apk upgrade --no-cache

# Copy package files first for better caching
COPY package*.json pnpm-lock.yaml* ./

# Install pnpm globally
RUN npm install -g pnpm@latest

# Install dependencies (all dependencies for flexibility)
RUN pnpm install --frozen-lockfile

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy application code
COPY . .

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port (dynamically from environment)
EXPOSE ${PORT:-8080}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "const http = require('http'); \
    const port = process.env.PORT || 8080; \
    http.get(\`http://localhost:\${port}/health\`, (res) => { \
        if (res.statusCode === 200) process.exit(0); \
        else process.exit(1); \
    }).on('error', () => process.exit(1));"

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["pnpm", "start"]