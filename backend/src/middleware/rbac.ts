import { Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import { errorResponse } from "../utils/response";

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return errorResponse(res, "Authentication required", 401);
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(res, "Insufficient permissions", 403);
    }

    next();
  };
};

export const authorizeAdmin = authorize(
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.PRINCIPAL
);

export const authorizeTeacher = authorize(
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.PRINCIPAL,
  UserRole.HEAD_TEACHER,
  UserRole.TEACHER
);

export const authorizeFinance = authorize(
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.ACCOUNTANT
);
