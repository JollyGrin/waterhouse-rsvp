# Waterhouse RSVP Monorepo

This is a monorepo containing the frontend and backend services for the Waterhouse RSVP application.

## Structure

```
├── packages/
│   ├── frontend/     # SvelteKit frontend application
│   ├── backend/      # Express backend API
│   └── shared/       # Shared Prisma client and types
```

## Prerequisites

- Node.js 18+
- Docker and Docker Compose (for containerized setup)
- PostgreSQL (for local development without Docker)

## Development Setup

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
# Backend (.env in packages/backend/)
cp packages/backend/.env.example packages/backend/.env
# Update the DATABASE_URL and other variables as needed
```

3. Set up the database:
```bash
# Run from the root directory
npm run prisma:migrate --workspace=shared
```

4. Start development servers:
```bash
# Start both frontend and backend
npm run dev

# Or start them separately
npm run dev:frontend
npm run dev:backend
```

The frontend will be available at http://localhost:5173 and the backend at http://localhost:3001.

### Docker Setup

#### Run Full Stack (Frontend + Backend + Database)

```bash
npm run docker:build
npm run docker:full
```

This will start:
- PostgreSQL database on port 5432
- Backend API on port 3001
- Frontend on port 3000

#### Run Backend Only (with Database)

This is useful when you want to develop the frontend locally but use a containerized backend:

```bash
npm run docker:build:backend
npm run docker:backend
```

Then run the frontend locally:
```bash
npm run dev:frontend
```

## Available Scripts

### Root Level
- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:frontend` - Start only the frontend
- `npm run dev:backend` - Start only the backend
- `npm run build` - Build all workspaces
- `npm run check` - Type check all workspaces
- `npm run docker:full` - Run full stack with Docker
- `npm run docker:backend` - Run backend only with Docker

### Frontend (packages/frontend)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Type checking
- `npm run lint` - Lint code

### Backend (packages/backend)
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript
- `npm run start` - Start production server
- `npm run check` - Type checking
- `npm run lint` - Lint code

### Shared (packages/shared)
- `npm run build` - Build TypeScript
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

## Environment Variables

### Backend
- `PORT` - Server port (default: 3001)
- `DATABASE_URL` - PostgreSQL connection string
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:5173)
- `CLERK_SECRET_KEY` - Clerk authentication secret key
- `NODE_ENV` - Environment (development/production)

### Frontend
- Standard SvelteKit environment variables
- API calls are proxied to the backend in development

## Database

The application uses PostgreSQL with Prisma ORM. The schema is defined in `packages/shared/prisma/schema.prisma`.

To manage the database:
```bash
# Generate Prisma client
npm run prisma:generate --workspace=shared

# Run migrations
npm run prisma:migrate --workspace=shared

# Open Prisma Studio
npm run prisma:studio --workspace=shared
```

## Deployment

Both frontend and backend have Dockerfiles for containerized deployment. The docker-compose files provide orchestration for the full stack.

For production deployment, ensure all environment variables are properly set and use the production builds.