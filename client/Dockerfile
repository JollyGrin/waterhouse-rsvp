# Use official Bun image
FROM oven/bun:1.1.13 as base

WORKDIR /app

# Copy package files and install dependencies
COPY bun.lockb package.json ./
RUN bun install

# Copy the rest of the project
COPY . .

# Build the app (adjust for your actual build command)
RUN bun run build

# Final image for running (optional for static hosting)
FROM oven/bun:1.1.13 as runner
WORKDIR /app

COPY --from=base /app ./

# If your app uses a dev server (like for SSR)
# CMD ["bun", "run", "preview"]

# If you built a static site (e.g. using `adapter-static`)
# you can serve it with something like serve or wrangler etc.
# Example:
# RUN bun add serve
# CMD ["bun", "x", "serve", "build"]

CMD ["bun", "run", "preview"]
