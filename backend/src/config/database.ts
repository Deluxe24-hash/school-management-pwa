import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger";

declare global {
  // prevent multiple instances of Prisma Client in development (HMR)
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma ?? new PrismaClient({
  log: [
    { emit: "event", level: "query" },
    { emit: "event", level: "error" },
    { emit: "event", level: "info" },
    { emit: "event", level: "warn" },
  ],
});

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

prisma.$on("query" as any, (e: any) => {
  logger.debug(`Query: ${e.query}`);
});

prisma.$on("error" as any, (e: any) => {
  logger.error(`Prisma Error: ${e.message}`);
});

export default prisma;
