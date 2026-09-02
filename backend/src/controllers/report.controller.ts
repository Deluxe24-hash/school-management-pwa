import { Request, Response } from "express";
import prisma from "../config/database";
import { successResponse } from "../utils/response";

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [
      totalStudents,
      totalTeachers,
      totalParents,
      totalClasses,
      totalSubjects,
      currentSession,
      todayAttendances,
      recentPayments,
    ] = await Promise.all([
      prisma.student.count({ where: { academicStatus: { in: ["ENROLLED", "PROMOTED"] } } }),
      prisma.teacher.count(),
      prisma.parent.count(),
      prisma.class.count(),
      prisma.subject.count(),
      prisma.academicSession.findFirst({ where: { isCurrent: true }, include: { terms: true } }),
      prisma.attendance.count({
        where: {
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      prisma.payment.findMany({
        where: { status: "SUCCESSFUL" },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { student: { select: { firstName: true, lastName: true } } },
      }),
    ]);

    const genderStats = await prisma.student.groupBy({
      by: ["gender"],
      where: { academicStatus: { in: ["ENROLLED", "PROMOTED"] } },
      _count: { gender: true },
    });

    return successResponse(res, {
      totalStudents,
      totalTeachers,
      totalParents,
      totalClasses,
      totalSubjects,
      currentSession,
      todayAttendances,
      recentPayments,
      genderStats,
    });
  } catch (error) { throw error; }
};

export const getStudentReport = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { sessionId, termId } = req.query;

    const [student, results, attendances, reportCard, fees] = await Promise.all([
      prisma.student.findUnique({
        where: { id: studentId },
        include: {
          user: { select: { email: true } },
          parent: true,
          enrollments: { include: { classArm: { include: { class: true } } }, orderBy: { enrolledAt: "desc" }, take: 1 },
        },
      }),
      prisma.result.findMany({
        where: { studentId, sessionId: sessionId as string, termId: termId as string },
        include: { subject: true },
        orderBy: { subject: { name: "asc" } },
      }),
      prisma.attendance.groupBy({
        by: ["status"],
        where: { studentId, sessionId: sessionId as string, termId: termId as string },
        _count: { status: true },
      }),
      prisma.reportCard.findUnique({
        where: {
          studentId_sessionId_termId: {
            studentId,
            sessionId: sessionId as string,
            termId: termId as string,
          },
        },
      }),
      prisma.fee.findMany({
        where: { studentId, sessionId: sessionId as string, termId: termId as string },
        include: { feeItem: true, payments: true },
      }),
    ]);

    if (!student) return successResponse(res, null, "Student not found");

    const totalPaid = fees.reduce((sum, f) => sum + f.payments.filter(p => p.status === "SUCCESSFUL").reduce((s, p) => s + p.amount, 0), 0);
    const totalBill = fees.reduce((sum, f) => sum + f.amount, 0);

    return successResponse(res, {
      student,
      results,
      attendance: attendances,
      reportCard,
      fees: { items: fees, totalBill, totalPaid, balance: totalBill - totalPaid },
    });
  } catch (error) { throw error; }
};

export const getClassPerformance = async (req: Request, res: Response) => {
  try {
    const { classArmId, sessionId, termId } = req.query;

    const results = await prisma.result.findMany({
      where: { classArmId: classArmId as string, sessionId: sessionId as string, termId: termId as string },
      include: { student: true, subject: true },
    });

    const subjectPerformance: any = {};
    results.forEach(r => {
      if (!subjectPerformance[r.subjectId]) {
        subjectPerformance[r.subjectId] = { subject: r.subject, scores: [], count: 0, total: 0 };
      }
      subjectPerformance[r.subjectId].scores.push(r.totalScore || 0);
      subjectPerformance[r.subjectId].total += r.totalScore || 0;
      subjectPerformance[r.subjectId].count++;
    });

    const performance = Object.values(subjectPerformance).map((p: any) => ({
      subject: p.subject,
      average: p.total / p.count,
      highest: Math.max(...p.scores),
      lowest: Math.min(...p.scores),
      count: p.count,
    }));

    return successResponse(res, performance);
  } catch (error) { throw error; }
};
