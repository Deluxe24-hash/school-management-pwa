import { Request, Response } from "express";
import prisma from "../config/database";
import { successResponse, errorResponse } from "../utils/response";
import { logAudit } from "../services/audit.service";

// Aggregates a student's locked results + attendance for a term into a single ReportCard row.
export const generateReportCard = async (req: Request, res: Response) => {
  try {
    const { studentId, classArmId, sessionId, termId } = req.body;

    const results = await prisma.result.findMany({
      where: { studentId, sessionId, termId },
    });
    if (results.length === 0) {
      return errorResponse(res, "No results found for this student in this term yet.", 422);
    }

    const totalSubjects = results.length;
    const totalScore = results.reduce((sum, r) => sum + (r.totalScore || 0), 0);
    const average = totalSubjects > 0 ? totalScore / totalSubjects : 0;

    // Class position: rank this student's average against classmates' averages for the same term.
    const classResults = await prisma.result.findMany({
      where: { classArmId, sessionId, termId },
    });
    const byStudent = new Map<string, number[]>();
    classResults.forEach((r) => {
      const list = byStudent.get(r.studentId) || [];
      list.push(r.totalScore || 0);
      byStudent.set(r.studentId, list);
    });
    const classAverages = Array.from(byStudent.entries())
      .map(([sid, scores]) => ({ sid, avg: scores.reduce((a, b) => a + b, 0) / scores.length }))
      .sort((a, b) => b.avg - a.avg);
    const classPosition = classAverages.findIndex((c) => c.sid === studentId) + 1;
    const classSize = classAverages.length;

    const attendances = await prisma.attendance.findMany({ where: { studentId, termId } });
    const attendancePresent = attendances.filter((a) => a.status === "PRESENT").length;
    const attendanceAbsent = attendances.filter((a) => a.status === "ABSENT").length;
    const attendanceLate = attendances.filter((a) => a.status === "LATE").length;
    const attendanceExcused = attendances.filter((a) => a.status === "EXCUSED").length;

    const reportCard = await prisma.reportCard.upsert({
      where: { studentId_sessionId_termId: { studentId, sessionId, termId } },
      update: {
        totalSubjects, totalScore, average, classPosition, classSize,
        attendancePresent, attendanceAbsent, attendanceLate, attendanceExcused,
        teacherRemark: req.body.teacherRemark, principalRemark: req.body.principalRemark,
        nextTermBegins: req.body.nextTermBegins ? new Date(req.body.nextTermBegins) : undefined,
      },
      create: {
        studentId, classArmId, sessionId, termId,
        totalSubjects, totalScore, average, classPosition, classSize,
        attendancePresent, attendanceAbsent, attendanceLate, attendanceExcused,
        teacherRemark: req.body.teacherRemark, principalRemark: req.body.principalRemark,
        nextTermBegins: req.body.nextTermBegins ? new Date(req.body.nextTermBegins) : undefined,
      },
    });

    await logAudit("CREATE", "report_cards", reportCard.id, req.user!.id, null, reportCard, req.ip, req.get("user-agent"));
    return successResponse(res, reportCard, "Report card generated", 201);
  } catch (error) { throw error; }
};

export const getReportCard = async (req: Request, res: Response) => {
  try {
    let { studentId } = req.query;
    const { sessionId, termId } = req.query;
    const role = req.user!.role;
    const isAdminTier = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "HEAD_TEACHER", "TEACHER"].includes(role);

    // Students can only ever view their own report card.
    if (role === "STUDENT") {
      studentId = req.user!.student?.id;
      if (!studentId) return errorResponse(res, "No student record linked to your account.", 403);
    }

    // Parents can only view a report card for one of their own linked children.
    if (role === "PARENT") {
      const parent = await prisma.parent.findUnique({
        where: { id: req.user!.parent?.id },
        select: { children: { select: { id: true } } },
      });
      const allowedIds = new Set((parent?.children || []).map((c) => c.id));
      if (!studentId || !allowedIds.has(studentId as string)) {
        return errorResponse(res, "You can only view report cards for your own children.", 403);
      }
    }

    const reportCard = await prisma.reportCard.findUnique({
      where: {
        studentId_sessionId_termId: {
          studentId: studentId as string,
          sessionId: sessionId as string,
          termId: termId as string,
        },
      },
    });
    if (!reportCard) return errorResponse(res, "No report card generated yet for this term.", 404);

    // Parents and students may only see a report card once it's been published by an admin.
    if (!isAdminTier && !reportCard.isPublished) {
      return errorResponse(res, "This report card hasn't been published yet.", 403);
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId as string },
      include: { enrollments: { include: { classArm: { include: { class: true } } }, orderBy: { enrolledAt: "desc" }, take: 1 } },
    });

    const results = await prisma.result.findMany({
      where: { studentId: studentId as string, sessionId: sessionId as string, termId: termId as string },
      include: { subject: true },
      orderBy: { subject: { name: "asc" } },
    });

    return successResponse(res, { reportCard, student, results });
  } catch (error) { throw error; }
};

export const publishReportCard = async (req: Request, res: Response) => {
  try {
    const { studentId, sessionId, termId } = req.body;
    const reportCard = await prisma.reportCard.update({
      where: { studentId_sessionId_termId: { studentId, sessionId, termId } },
      data: { isPublished: true, publishedAt: new Date(), publishedBy: req.user!.id },
    });
    await logAudit("PUBLISH", "report_cards", reportCard.id, req.user!.id, null, { studentId }, req.ip, req.get("user-agent"));
    return successResponse(res, reportCard, "Report card published — parents and the student can now view it.");
  } catch (error) { throw error; }
};

export const unpublishReportCard = async (req: Request, res: Response) => {
  try {
    const { studentId, sessionId, termId } = req.body;
    const reportCard = await prisma.reportCard.update({
      where: { studentId_sessionId_termId: { studentId, sessionId, termId } },
      data: { isPublished: false, publishedAt: null, publishedBy: null },
    });
    await logAudit("UNPUBLISH", "report_cards", reportCard.id, req.user!.id, null, { studentId }, req.ip, req.get("user-agent"));
    return successResponse(res, reportCard, "Report card unpublished.");
  } catch (error) { throw error; }
};
