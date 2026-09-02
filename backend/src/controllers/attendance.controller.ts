import { Request, Response } from "express";
import prisma from "../config/database";
import { successResponse, errorResponse } from "../utils/response";
import { logAudit } from "../services/audit.service";

export const getAttendance = async (req: Request, res: Response) => {
  try {
    const { classArmId, date, sessionId, termId, page = "1", limit = "50" } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (classArmId) where.classArmId = classArmId as string;
    if (date) where.date = new Date(date as string);
    if (sessionId) where.sessionId = sessionId as string;
    if (termId) where.termId = termId as string;

    const [attendances, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: {
          student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
          teacher: { select: { firstName: true, lastName: true } },
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { date: "desc" },
      }),
      prisma.attendance.count({ where }),
    ]);

    return successResponse(res, { attendances, total });
  } catch (error) { throw error; }
};

export const getStudentAttendance = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { sessionId, termId } = req.query;

    const where: any = { studentId };
    if (sessionId) where.sessionId = sessionId as string;
    if (termId) where.termId = termId as string;

    const attendances = await prisma.attendance.findMany({
      where,
      orderBy: { date: "desc" },
    });

    const stats = {
      present: attendances.filter(a => a.status === "PRESENT").length,
      absent: attendances.filter(a => a.status === "ABSENT").length,
      late: attendances.filter(a => a.status === "LATE").length,
      excused: attendances.filter(a => a.status === "EXCUSED").length,
      total: attendances.length,
    };

    return successResponse(res, { attendances, stats });
  } catch (error) { throw error; }
};

export const markAttendance = async (req: Request, res: Response) => {
  try {
    const { records } = req.body; // Array of { studentId, status, remark }
    const { classArmId, date, sessionId, termId } = req.body;

    const teacherId = req.user!.teacher?.id;
    if (!teacherId && req.user!.role !== "ADMIN" && req.user!.role !== "SUPER_ADMIN") {
      return errorResponse(res, "Only teachers can mark attendance", 403);
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const results = await prisma.$transaction(
      records.map((record: any) =>
        prisma.attendance.upsert({
          where: {
            studentId_date_termId: {
              studentId: record.studentId,
              date: attendanceDate,
              termId,
            },
          },
          update: {
            status: record.status,
            remark: record.remark,
            teacherId: teacherId || req.user!.id,
          },
          create: {
            date: attendanceDate,
            status: record.status,
            remark: record.remark,
            studentId: record.studentId,
            classArmId,
            teacherId: teacherId || req.user!.id,
            sessionId,
            termId,
          },
        })
      )
    );

    await logAudit("CREATE", "attendances", null, req.user!.id, null, { date, classArmId, count: records.length }, req.ip, req.get("user-agent"));
    return successResponse(res, results, "Attendance marked", 201);
  } catch (error) { throw error; }
};

export const getAttendanceStats = async (req: Request, res: Response) => {
  try {
    const { classArmId, sessionId, termId } = req.query;

    const where: any = {};
    if (classArmId) where.classArmId = classArmId as string;
    if (sessionId) where.sessionId = sessionId as string;
    if (termId) where.termId = termId as string;

    const stats = await prisma.attendance.groupBy({
      by: ["status"],
      where,
      _count: { status: true },
    });

    return successResponse(res, stats);
  } catch (error) { throw error; }
};
