const { PrismaClient } = require("@prisma/client");
const env = require("./env");

// Reuse a single PrismaClient instance across the app (and across hot
// reloads in dev) to avoid exhausting the Postgres connection pool.
const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
