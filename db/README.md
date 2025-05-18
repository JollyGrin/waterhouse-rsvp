# Waterhouse Reservation System - Database

This folder contains the database schema and migration files for the Waterhouse Reservation System.

## Database Schema

The database uses PostgreSQL with Prisma as the ORM. The schema includes:

- **Users**: Linked with Clerk authentication using the Clerk user ID
- **Studios**: Details about each studio available for booking
- **Reservations**: Booking information connecting users with studios

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file by copying the example:
   ```bash
   cp .env.example .env
   ```

3. Update the `.env` file with your PostgreSQL connection string.

4. Generate Prisma client:
   ```bash
   npm run generate
   ```

5. Push the schema to your database:
   ```bash
   npm run db:push
   ```

## Usage with Railway

For Railway deployment:

1. Create a PostgreSQL database in your Railway project
2. Get the connection string from the Railway dashboard
3. Set the `DATABASE_URL` environment variable in Railway with that connection string
4. Run migrations on deployment with `npm run migrate:deploy`

## Development Workflow

- Run `npm run studio` to open Prisma Studio for visual database management
- Run `npm run migrate:dev` when you make schema changes (creates migration files)
- Run `npm run generate` after schema changes to update the Prisma client
