import winston from "winston";

const isProduction = process.env.NODE_ENV === "production";
const isServerless = !!process.env.VERCEL;

const logger = winston.createLogger({
  level: isProduction ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "school-management-api" },
  transports: isServerless
    ? [
        // Vercel's filesystem is read-only — log to stdout/stderr only,
        // which Vercel automatically captures as runtime logs.
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        }),
      ]
    : [
        new winston.transports.File({ filename: "logs/error.log", level: "error" }),
        new winston.transports.File({ filename: "logs/combined.log" }),
      ],
});

if (!isProduction && !isServerless) {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

export default logger;
