import { Prisma } from "@prisma/client";

type AuthUser = Prisma.UserGetPayload<{
  include: { student: true; teacher: true; parent: true; staff: true };
}>;

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
