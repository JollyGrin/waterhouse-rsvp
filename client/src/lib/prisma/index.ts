import { PrismaClient } from '@prisma/client';

// Use a singleton pattern for Prisma to prevent too many connections in development
const prismaClientSingleton = () => {
  return new PrismaClient();
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

// Create a singleton instance or reuse the existing one
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

// In development, save the instance in the global object
// Using typeof check to avoid issues with process object in different environments
if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
