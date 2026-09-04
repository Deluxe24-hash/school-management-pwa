import { Request, Response } from "express";
import prisma from "../config/database";
import { successResponse, errorResponse } from "../utils/response";
import { logAudit } from "../services/audit.service";

export const getAssignments = async (req: Request, res: Response) => {
  try {
    const { classArmId, subjectId, teacherId, sessionId, termId, page = "1", limit = "20" } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (classArmId) where.classArmId = classArmId as string;
    if (subjectId) where.subjectId = subjectId as string;
    if (teacherId) where.teacherId = teacherId as string;
    if (sessionId) where.sessionId = sessionId as string;
    if (termId) where.termId = termId as string;

    const [assignments, total] = await Promise.all([
      prisma.assignment.findMany({
        where,
        include: {
          subject: true,
          teacher: { select: { firstName: true, lastName: true } },
          _count: { select: { submissions: true } },
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: "desc" },
      }),
      prisma.assignment.count({ where }),
    ]);

    return successResponse(res, { assignments, total });
  } catch (error) { throw error; }
};

export const getAssignment = async (req: Request, res: Response) => {
  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: req.params.id },
      include: {
        subject: true,
        teacher: true,
        submissions: { include: { student: { select: { firstName: true, lastName: true, admissionNumber: true } } } },
      },
    });
    if (!assignment) return errorResponse(res, "Assignment not found", 404);
    return successResponse(res, assignment);
  } catch (error) { throw error; }
};

export const createAssignment = async (req: Request, res: Response) => {
  try {
    const { title, description, instructions, type, maxScore, dueDate, attachmentUrl, subjectId, classArmId, sessionId, termId } = req.body;
    let teacherId = req.user!.teacher?.id;

    if (!teacherId) {
      if (req.user!.role !== "ADMIN" && req.user!.role !== "SUPER_ADMIN" && req.user!.role !== "PRINCIPAL") {
        return errorResponse(res, "Only teachers can create assignments", 403);
      }
      const subjectTeacher = await prisma.classSubject.findFirst({ where: { subjectId, class: { arms: { some: { id: classArmId } } } } });
      teacherId = subjectTeacher?.teacherId ?? undefined;
      if (!teacherId) {
        const anyTeacher = await prisma.teacher.findFirst();
        teacherId = anyTeacher?.id;
      }
      if (!teacherId) {
        return errorResponse(res, "No teacher is assigned to this subject yet, and no teacher records exist to attribute this to. Add a teacher first.", 422);
      }
    }

    const assignment = await prisma.assignment.create({
      data: {
        title, description, instructions, type, maxScore,
        dueDate: new Date(dueDate),
        attachmentUrl,
        teacherId,
        subjectId,
        classArmId,
        sessionId,
        termId,
      },
      include: { subject: true },
    });

    await logAudit("CREATE", "assignments", assignment.id, req.user!.id, null, req.body, req.ip, req.get("user-agent"));
    return successResponse(res, assignment, "Assignment created", 201);
  } catch (error) { throw error; }
};

export const submitAssignment = async (req: Request, res: Response) => {
  try {
    const { assignmentId, content, attachmentUrl } = req.body;
    const studentId = req.user!.student?.id;

    if (!studentId) return errorResponse(res, "Only students can submit assignments", 403);

    const submission = await prisma.submission.upsert({
      where: {
        studentId_assignmentId: { studentId, assignmentId },
      },
      update: { content, attachmentUrl },
      create: {
        studentId,
        assignmentId,
        content,
        attachmentUrl,
      },
      include: { student: true, assignment: true },
    });

    return successResponse(res, submission, "Assignment submitted", 201);
  } catch (error) { throw error; }
};

export const gradeSubmission = async (req: Request, res: Response) => {
  try {
    const { submissionId, score, feedback } = req.body;

    const submission = await prisma.submission.update({
      where: { id: submissionId },
      data: { score, feedback },
      include: { student: true, assignment: true },
    });

    await logAudit("GRADE", "submissions", submissionId, req.user!.id, null, { score, feedback }, req.ip, req.get("user-agent"));
    return successResponse(res, submission, "Submission graded");
  } catch (error) { throw error; }
};
