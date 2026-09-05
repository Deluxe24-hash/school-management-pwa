import { Request, Response } from "express";
import prisma from "../config/database";
import { successResponse } from "../utils/response";

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const unreadCount = await prisma.notification.count({ where: { userId: req.user!.id, isRead: false } });
    return successResponse(res, { notifications, unreadCount });
  } catch (error) { throw error; }
};

export const markNotificationRead = async (req: Request, res: Response) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    return successResponse(res, notification, "Marked as read");
  } catch (error) { throw error; }
};

export const markAllNotificationsRead = async (req: Request, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true },
    });
    return successResponse(res, null, "All notifications marked as read");
  } catch (error) { throw error; }
};
