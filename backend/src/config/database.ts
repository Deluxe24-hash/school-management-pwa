import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger";

const prisma = new PrismaClient({
  log: [
    { emit: "event", level: "query" },
    { emit: "event", level: "error" },
    { emit: "event", level: "info" },
    { emit: "event", level: "warn" },
  ],
});

prisma.$on("query" as any, (e: any) => {
  logger.debug(`Query: ${e.query}`);
});

prisma.$on("error" as any, (e: any) => {
  logger.error(`Prisma Error: ${e.message}`);
});

export default prisma;
