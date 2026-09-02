import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { errorResponse } from "../utils/response";

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: any) {
      if (error.errors) {
        const errors = error.errors.map((e: any) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        return errorResponse(res, "Validation failed", 422, errors);
      }
      next(error);
    }
  };
};
