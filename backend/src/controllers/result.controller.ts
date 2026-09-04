import { Request, Response } from "express";
import prisma from "../config/database";
import { successResponse, errorResponse } from "../utils/response";
import { logAudit } from "../services/audit.service";
import { calculateGrade } from "../utils/helpers";

export const getResults = async (req: Request, res: Response) => {
  try {
    const { studentId, classArmId, subjectId, sessionId, termId, page = "1", limit = "50" } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (studentId) where.studentId = studentId as string;
    if (classArmId) where.classArmId = classArmId as string;
    if (subjectId) where.subjectId = subjectId as string;
    if (sessionId) where.sessionId = sessionId as string;
    if (termId) where.termId = termId as string;

    const [results, total] = await Promise.all([
      prisma.result.findMany({
        where,
        include: {
          student: { select: { firstName: true, lastName: true, admissionNumber: true } },
          subject: true,
          session: true,
          term: true,
          teacher: { select: { firstName: true, lastName: true } },
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: "desc" },
      }),
      prisma.result.count({ where }),
    ]);

    return successResponse(res, { results, total });
  } catch (error) { throw error; }
};

export const getStudentResults = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { sessionId, termId } = req.query;

    const where: any = { studentId };
    if (sessionId) where.sessionId = sessionId as string;
    if (termId) where.termId = termId as string;

    const results = await prisma.result.findMany({
      where,
      include: { subject: true, session: true, term: true },
      orderBy: { subject: { name: "asc" } },
    });

    const totalScore = results.reduce((sum, r) => sum + (r.totalScore || 0), 0);
    const average = results.length > 0 ? totalScore / results.length : 0;

    return successResponse(res, { results, summary: { totalSubjects: results.length, totalScore, average } });
  } catch (error) { throw error; }
};

export const enterResult = async (req: Request, res: Response) => {
  try {
    const { studentId, subjectId, classArmId, sessionId, termId, caScore, examScore } = req.body;

    const existing = await prisma.result.findUnique({
      where: {
        studentId_subjectId_sessionId_termId: {
          studentId, subjectId, sessionId, termId,
        },
      },
    });

    if (existing?.isLocked) {
      return errorResponse(res, "Result is locked and cannot be modified", 403);
    }

    const settings = await prisma.schoolSetting.findFirst();
    const caWeight = settings?.caWeight || 40;
    const examWeight = settings?.examWeight || 60;

    const totalScore = ((caScore || 0) * caWeight / 100) + ((examScore || 0) * examWeight / 100);

    let grade = null;
    let gradePoint = null;
    if (settings?.gradingSystem && Array.isArray(settings.gradingSystem)) {
      const gradeInfo = calculateGrade(totalScore, settings.gradingSystem as any);
      grade = gradeInfo.grade;
      gradePoint = gradeInfo.gradePoint;
    }

    let teacherId = req.user!.teacher?.id;
    if (!teacherId) {
      const classArm = await prisma.classArm.findUnique({ where: { id: classArmId } });
      teacherId = classArm?.classTeacherId ?? undefined;
      if (!teacherId) {
        const subjectTeacher = await prisma.classSubject.findFirst({ where: { classId: classArm?.classId, subjectId } });
        teacherId = subjectTeacher?.teacherId ?? undefined;
      }
      if (!teacherId) {
        const anyTeacher = await prisma.teacher.findFirst();
        teacherId = anyTeacher?.id;
      }
      if (!teacherId) {
        return errorResponse(res, "No teacher is assigned to this class/subject yet, and no teacher records exist to attribute this to. Add a teacher first.", 422);
      }
    }

    const result = await prisma.result.upsert({
      where: {
        studentId_subjectId_sessionId_termId: {
          studentId, subjectId, sessionId, termId,
        },
      },
      update: {
        caScore: caScore || existing?.caScore,
        examScore: examScore || existing?.examScore,
        totalScore,
        grade,
        gradePoint,
        teacherId,
      },
      create: {
        caScore: caScore || 0,
        examScore: examScore || 0,
        totalScore,
        grade,
        gradePoint,
        studentId,
        subjectId,
        classArmId,
        teacherId,
        sessionId,
        termId,
      },
      include: { student: true, subject: true },
    });

    await logAudit("CREATE", "results", result.id, req.user!.id, existing, result, req.ip, req.get("user-agent"));
    return successResponse(res, result, "Result saved", 201);
  } catch (error) { throw error; }
};

export const lockResults = async (req: Request, res: Response) => {
  try {
    const { classArmId, sessionId, termId, subjectId } = req.body;
    const where: any = { classArmId, sessionId, termId };
    if (subjectId) where.subjectId = subjectId;

    await prisma.result.updateMany({ where, data: { isLocked: true } });
    await logAudit("LOCK", "results", null, req.user!.id, null, { classArmId, sessionId, termId }, req.ip, req.get("user-agent"));
    return successResponse(res, null, "Results locked");
  } catch (error) { throw error; }
};

export const unlockResults = async (req: Request, res: Response) => {
  try {
    const { classArmId, sessionId, termId, subjectId } = req.body;
    const where: any = { classArmId, sessionId, termId };
    if (subjectId) where.subjectId = subjectId;

    await prisma.result.updateMany({ where, data: { isLocked: false } });
    await logAudit("UNLOCK", "results", null, req.user!.id, null, { classArmId, sessionId, termId }, req.ip, req.get("user-agent"));
    return successResponse(res, null, "Results unlocked");
  } catch (error) { throw error; }
};

export const processResults = async (req: Request, res: Response) => {
  try {
    const { classArmId, sessionId, termId } = req.body;

    const results = await prisma.result.findMany({
      where: { classArmId, sessionId, termId },
      include: { student: true, subject: true },
    });

    const studentResults: any = {};
    results.forEach(r => {
      if (!studentResults[r.studentId]) {
        studentResults[r.studentId] = { results: [], total: 0 };
      }
      studentResults[r.studentId].results.push(r);
      studentResults[r.studentId].total += r.totalScore || 0;
    });

    const subjectGroups: any = {};
    results.forEach(r => {
      if (!subjectGroups[r.subjectId]) subjectGroups[r.subjectId] = [];
      subjectGroups[r.subjectId].push(r);
    });

    for (const subjectId in subjectGroups) {
      const sorted = subjectGroups[subjectId].sort((a: any, b: any) => (b.totalScore || 0) - (a.totalScore || 0));
      for (let i = 0; i < sorted.length; i++) {
        await prisma.result.update({
          where: { id: sorted[i].id },
          data: { position: i + 1 },
        });
      }
    }

    const studentArray = Object.entries(studentResults).map(([id, data]: [string, any]) => ({
      id,
      average: data.total / data.results.length,
    }));
    studentArray.sort((a, b) => b.average - a.average);

    for (let i = 0; i < studentArray.length; i++) {
      const studentId = studentArray[i].id;
      const totalSubjects = studentResults[studentId].results.length;
      const totalScore = studentResults[studentId].total;
      const average = studentArray[i].average;

      await prisma.reportCard.upsert({
        where: {
          studentId_sessionId_termId: { studentId, sessionId, termId },
        },
        update: {
          totalSubjects,
          totalScore,
          average,
          classPosition: i + 1,
          classSize: studentArray.length,
        },
        create: {
          studentId,
          classArmId,
          sessionId,
          termId,
          totalSubjects,
          totalScore,
          average,
          classPosition: i + 1,
          classSize: studentArray.length,
        },
      });
    }

    await logAudit("PROCESS", "results", null, req.user!.id, null, { classArmId, sessionId, termId }, req.ip, req.get("user-agent"));
    return successResponse(res, null, "Results processed successfully");
  } catch (error) { throw error; }
};
