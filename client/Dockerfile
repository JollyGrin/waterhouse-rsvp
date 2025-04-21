FROM oven/bun:latest as builder

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies with bun
RUN bun install --frozen-lockfile

# Copy the rest of the app
COPY . .

# Build the app with bun
RUN bun run build

# Stage 2: Serve the app
FROM oven/bun:latest as runtime

WORKDIR /app

# For a static build (if you're using adapter-static)
RUN bun install -g serve
COPY --from=builder /app/build ./build

# For a server build (if you're using adapter-node)
# COPY --from=builder /app/package.json ./
# COPY --from=builder /app/build ./build
# RUN bun install --production

# Environment variables
ENV PORT=3000
ENV HOST=0.0.0.0

# Static sites use serve
CMD ["serve", "build", "-p", "3000", "-s"]

# For server builds use this instead:
# CMD ["bun", "build"]
