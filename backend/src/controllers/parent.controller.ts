import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../config/database";
import { successResponse, errorResponse } from "../utils/response";
import { logAudit } from "../services/audit.service";

export const getParents = async (req: Request, res: Response) => {
  try {
    const { search, page = "1", limit = "20" } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = search
      ? {
          OR: [
            { firstName: { contains: search as string, mode: "insensitive" } },
            { lastName: { contains: search as string, mode: "insensitive" } },
            { phone: { contains: search as string, mode: "insensitive" } },
          ],
        }
      : {};

    const [parents, total] = await Promise.all([
      prisma.parent.findMany({
        where,
        include: { user: true, children: { include: { enrollments: { include: { classArm: true }, orderBy: { enrolledAt: "desc" }, take: 1 } } } },
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: "desc" },
      }),
      prisma.parent.count({ where }),
    ]);

    return successResponse(res, { parents, total, page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (error) { throw error; }
};

export const getParent = async (req: Request, res: Response) => {
  try {
    const parent = await prisma.parent.findUnique({
      where: { id: req.params.id },
      include: { user: true, children: { include: { enrollments: { include: { classArm: true }, orderBy: { enrolledAt: "desc" }, take: 1 } } } },
    });
    if (!parent) return errorResponse(res, "Parent not found", 404);
    return successResponse(res, parent);
  } catch (error) { throw error; }
};

export const createParent = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, phone, email, address, occupation, relationship, childIds } = req.body;
    if (!firstName || !lastName || !phone) {
      return errorResponse(res, "First name, last name, and phone are required.", 422);
    }

    const loginEmail = email
      ? email.toLowerCase()
      : `${phone.replace(/\D/g, "")}@parents.local`;
    const password = await bcrypt.hash("Parent@123", 12);

    const user = await prisma.user.create({ data: { email: loginEmail, password, role: "PARENT" } });
    const parent = await prisma.parent.create({
      data: { firstName, lastName, phone, email, address, occupation, relationship, userId: user.id },
      include: { user: true },
    });

    if (Array.isArray(childIds) && childIds.length > 0) {
      await prisma.student.updateMany({ where: { id: { in: childIds } }, data: { parentId: parent.id } });
    }

    await logAudit("CREATE", "parents", parent.id, req.user!.id, null, req.body, req.ip, req.get("user-agent"));
    return successResponse(res, parent, "Parent added", 201);
  } catch (error) { throw error; }
};

export const updateParent = async (req: Request, res: Response) => {
  try {
    const { childIds, email, ...rest } = req.body;
    const parent = await prisma.parent.update({
      where: { id: req.params.id },
      data: rest,
      include: { user: true },
    });

    if (Array.isArray(childIds)) {
      // Unlink any children no longer selected, then link the newly selected set.
      await prisma.student.updateMany({ where: { parentId: parent.id, id: { notIn: childIds } }, data: { parentId: null } });
      if (childIds.length > 0) {
        await prisma.student.updateMany({ where: { id: { in: childIds } }, data: { parentId: parent.id } });
      }
    }

    await logAudit("UPDATE", "parents", parent.id, req.user!.id, null, req.body, req.ip, req.get("user-agent"));
    return successResponse(res, parent, "Parent updated");
  } catch (error) { throw error; }
};

export const deleteParent = async (req: Request, res: Response) => {
  try {
    const parent = await prisma.parent.findUnique({ where: { id: req.params.id } });
    if (!parent) return errorResponse(res, "Parent not found", 404);
    // Deleting the linked user cascades to remove the parent record and their login together.
    await prisma.user.delete({ where: { id: parent.userId } });
    await logAudit("DELETE", "parents", parent.id, req.user!.id, parent, null, req.ip, req.get("user-agent"));
    return successResponse(res, null, "Parent removed");
  } catch (error) { throw error; }
};
