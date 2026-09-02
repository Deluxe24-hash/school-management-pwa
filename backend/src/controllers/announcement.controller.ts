import { Request, Response } from "express";
import prisma from "../config/database";
import { successResponse, errorResponse } from "../utils/response";
import { logAudit } from "../services/audit.service";

export const getAnnouncements = async (req: Request, res: Response) => {
  try {
    const { target, page = "1", limit = "20" } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = { isActive: true };
    if (target) {
      where.targetRoles = { has: target as string };
    }

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.announcement.count({ where }),
    ]);

    return successResponse(res, { announcements, total });
  } catch (error) { throw error; }
};

export const getAnnouncement = async (req: Request, res: Response) => {
  try {
    const announcement = await prisma.announcement.findUnique({
      where: { id: req.params.id },
    });
    if (!announcement) return errorResponse(res, "Announcement not found", 404);
    return successResponse(res, announcement);
  } catch (error) { throw error; }
};

export const createAnnouncement = async (req: Request, res: Response) => {
  try {
    const { title, content, priority, targetRoles, targetClassArms, expiresAt } = req.body;

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        priority,
        targetRoles,
        targetClassArms,
        publishedBy: req.user!.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    await logAudit("CREATE", "announcements", announcement.id, req.user!.id, null, req.body, req.ip, req.get("user-agent"));
    return successResponse(res, announcement, "Announcement published", 201);
  } catch (error) { throw error; }
};

export const updateAnnouncement = async (req: Request, res: Response) => {
  try {
    const announcement = await prisma.announcement.update({
      where: { id: req.params.id },
      data: req.body,
    });
    await logAudit("UPDATE", "announcements", announcement.id, req.user!.id, null, req.body, req.ip, req.get("user-agent"));
    return successResponse(res, announcement, "Announcement updated");
  } catch (error) { throw error; }
};

export const deleteAnnouncement = async (req: Request, res: Response) => {
  try {
    await prisma.announcement.delete({ where: { id: req.params.id } });
    await logAudit("DELETE", "announcements", req.params.id, req.user!.id, null, null, req.ip, req.get("user-agent"));
    return successResponse(res, null, "Announcement deleted");
  } catch (error) { throw error; }
};
