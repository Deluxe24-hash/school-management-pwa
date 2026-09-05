import { Request, Response } from "express";
import prisma from "../config/database";
import { successResponse, errorResponse } from "../utils/response";
import { logAudit } from "../services/audit.service";

export const getTimetable = async (req: Request, res: Response) => {
  try {
    const { classArmId, teacherId } = req.query;
    const where: any = {};
    if (classArmId) where.classArmId = classArmId as string;
    if (teacherId) where.teacherId = teacherId as string;

    const entries = await prisma.timetable.findMany({
      where,
      include: { teacher: true, subject: true, classArm: true },
      orderBy: [{ day: "asc" }, { startTime: "asc" }],
    });
    return successResponse(res, entries);
  } catch (error) { throw error; }
};

export const createTimetableEntry = async (req: Request, res: Response) => {
  try {
    const { day, startTime, endTime, room, teacherId, subjectId, classArmId, classId, sessionId, termId } = req.body;

    // Prevent double-booking the same teacher or the same class arm in an overlapping slot on the same day.
    const clash = await prisma.timetable.findFirst({
      where: {
        day,
        termId,
        OR: [{ teacherId }, { classArmId }],
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } },
        ],
      },
    });
    if (clash) {
      return errorResponse(res, "This slot clashes with an existing timetable entry for this teacher or class.", 409);
    }

    const entry = await prisma.timetable.create({
      data: { day, startTime, endTime, room, teacherId, subjectId, classArmId, classId, sessionId, termId },
      include: { teacher: true, subject: true, classArm: true },
    });
    await logAudit("CREATE", "timetables", entry.id, req.user!.id, null, entry, req.ip, req.get("user-agent"));
    return successResponse(res, entry, "Timetable entry created", 201);
  } catch (error) { throw error; }
};

export const deleteTimetableEntry = async (req: Request, res: Response) => {
  try {
    const entry = await prisma.timetable.delete({ where: { id: req.params.id } });
    await logAudit("DELETE", "timetables", entry.id, req.user!.id, entry, null, req.ip, req.get("user-agent"));
    return successResponse(res, null, "Timetable entry removed");
  } catch (error) { throw error; }
};
