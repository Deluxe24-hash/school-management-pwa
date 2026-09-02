import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import logger from "../utils/logger";
import { errorResponse } from "../utils/response";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack, path: req.path });

  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return errorResponse(res, "Validation failed", 422, errors);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return errorResponse(res, "A record with this information already exists", 409);
    }
    if (err.code === "P2025") {
      return errorResponse(res, "Record not found", 404);
    }
    return errorResponse(res, "Database error", 500);
  }

  if (err.name === "JsonWebTokenError") {
    return errorResponse(res, "Invalid token", 401);
  }

  if (err.name === "TokenExpiredError") {
    return errorResponse(res, "Token expired", 401);
  }

  return errorResponse(
    res,
    process.env.NODE_ENV === "production"
      ? "An unexpected error occurred"
      : err.message,
    500
  );
};
