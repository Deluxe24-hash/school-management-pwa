import { Request, Response } from "express";
import prisma from "../config/database";
import { successResponse, errorResponse } from "../utils/response";

export const getInbox = async (req: Request, res: Response) => {
  try {
    const messages = await prisma.message.findMany({
      where: { receiverId: req.user!.id },
      include: { sender: true },
      orderBy: { createdAt: "desc" },
    });
    return successResponse(res, messages);
  } catch (error) { throw error; }
};

export const getSent = async (req: Request, res: Response) => {
  try {
    const messages = await prisma.message.findMany({
      where: { senderId: req.user!.id },
      include: { receiver: true },
      orderBy: { createdAt: "desc" },
    });
    return successResponse(res, messages);
  } catch (error) { throw error; }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { receiverId, subject, content } = req.body;
    if (!receiverId || !content) return errorResponse(res, "Recipient and message content are required.", 422);

    const message = await prisma.message.create({
      data: { senderId: req.user!.id, receiverId, subject: subject || "(No subject)", content },
      include: { sender: true, receiver: true },
    });

    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: "GENERAL",
        title: "New message",
        content: `You have a new message: "${subject || content.slice(0, 40)}"`,
      },
    });

    return successResponse(res, message, "Message sent", 201);
  } catch (error) { throw error; }
};

export const markMessageRead = async (req: Request, res: Response) => {
  try {
    const message = await prisma.message.update({
      where: { id: req.params.id },
      data: { isRead: true, readAt: new Date() },
    });
    return successResponse(res, message, "Marked as read");
  } catch (error) { throw error; }
};

// Directory of people this user is allowed to message — kept simple: any staff/teacher for
// students/parents, and any user for admin-tier roles.
export const getContacts = async (req: Request, res: Response) => {
  try {
    const role = req.user!.role;
    let users;
    if (["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "HEAD_TEACHER"].includes(role)) {
      users = await prisma.user.findMany({
        where: { id: { not: req.user!.id } },
        include: { teacher: true, student: true, parent: true },
        take: 200,
      });
    } else {
      users = await prisma.user.findMany({
        where: { role: { in: ["TEACHER", "SUPER_ADMIN", "ADMIN", "PRINCIPAL", "HEAD_TEACHER"] }, id: { not: req.user!.id } },
        include: { teacher: true },
        take: 200,
      });
    }
    return successResponse(res, users);
  } catch (error) { throw error; }
};
