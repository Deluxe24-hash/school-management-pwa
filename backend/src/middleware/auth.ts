import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../config/database";
import { errorResponse } from "../utils/response";

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(res, "Authentication required", 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      role: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        student: true,
        teacher: true,
        parent: true,
        staff: true,
      },
    });

    if (!user || user.status !== "ACTIVE") {
      return errorResponse(res, "User not found or inactive", 401);
    }

    req.user = user;
    next();
  } catch (error) {
    return errorResponse(res, "Invalid or expired token", 401);
  }
};
