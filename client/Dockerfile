FROM oven/bun:latest

WORKDIR /app

# Copy package files first for better caching
COPY package.json ./

# Install dependencies
RUN bun install

# Copy source files
COPY . .

# Build the app
RUN bun run build

# Expose the port
ENV PORT=3000
EXPOSE 3000

# Start the application (adapter-node creates a standalone server)
CMD ["bun", "build"]
