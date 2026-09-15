import { Request, Response } from "express";
import prisma from "../config/database";
import { successResponse, errorResponse } from "../utils/response";
import { logAudit } from "../services/audit.service";

export const getAssignments = async (req: Request, res: Response) => {
  try {
    const { classArmId, subjectId, teacherId, sessionId, termId, page = "1", limit = "20" } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const role = req.user!.role;
    const isAdminTier = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(role);

    const where: any = {};
    if (classArmId) where.classArmId = classArmId as string;
    if (subjectId) where.subjectId = subjectId as string;
    if (teacherId) where.teacherId = teacherId as string;
    if (sessionId) where.sessionId = sessionId as string;
    if (termId) where.termId = termId as string;

    // Parents, students, and non-admin teachers only ever see assignments the admin has published.
    // Admin/Principal see everything, including drafts pending their review.
    if (!isAdminTier) where.isPublished = true;

    // Parents may only see assignments for classes their own children are actually in.
    if (role === "PARENT") {
      const parent = await prisma.parent.findUnique({
        where: { id: req.user!.parent?.id },
        select: { children: { select: { enrollments: { select: { classArmId: true }, orderBy: { enrolledAt: "desc" }, take: 1 } } } },
      });
      const allowedArmIds = new Set(
        (parent?.children || []).flatMap((c: any) => c.enrollments.map((e: any) => e.classArmId))
      );
      if (classArmId) {
        if (!allowedArmIds.has(classArmId as string)) return successResponse(res, { assignments: [], total: 0 });
      } else {
        where.classArmId = { in: Array.from(allowedArmIds) };
      }
    }

    // Students only ever see assignments for their own current class.
    if (role === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: { id: req.user!.student?.id },
        select: { enrollments: { select: { classArmId: true }, orderBy: { enrolledAt: "desc" }, take: 1 } },
      });
      const ownArmId = student?.enrollments?.[0]?.classArmId;
      where.classArmId = ownArmId || "__none__";
    }

    const [assignments, total] = await Promise.all([
      prisma.assignment.findMany({
        where,
        include: {
          subject: true,
          classArm: { include: { class: true } },
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

    const role = req.user!.role;
    const isAdminTier = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(role);
    if (!isAdminTier && !assignment.isPublished) {
      return errorResponse(res, "This assignment hasn't been published yet.", 403);
    }

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

export const updateAssignment = async (req: Request, res: Response) => {
  try {
    const { title, description, instructions, type, maxScore, dueDate, attachmentUrl, subjectId, classArmId, sessionId, termId } = req.body;
    const assignment = await prisma.assignment.update({
      where: { id: req.params.id },
      data: {
        title, description, instructions, type, maxScore,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        attachmentUrl, subjectId, classArmId, sessionId, termId,
      },
      include: { subject: true },
    });
    await logAudit("UPDATE", "assignments", assignment.id, req.user!.id, null, req.body, req.ip, req.get("user-agent"));
    return successResponse(res, assignment, "Assignment updated");
  } catch (error) { throw error; }
};

export const deleteAssignment = async (req: Request, res: Response) => {
  try {
    const assignment = await prisma.assignment.delete({ where: { id: req.params.id } });
    await logAudit("DELETE", "assignments", req.params.id, req.user!.id, assignment, null, req.ip, req.get("user-agent"));
    return successResponse(res, null, "Assignment deleted");
  } catch (error) { throw error; }
};

export const publishAssignment = async (req: Request, res: Response) => {
  try {
    const assignment = await prisma.assignment.update({
      where: { id: req.params.id },
      data: { isPublished: true, publishedAt: new Date(), publishedBy: req.user!.id },
    });
    await logAudit("PUBLISH", "assignments", assignment.id, req.user!.id, null, null, req.ip, req.get("user-agent"));
    return successResponse(res, assignment, "Assignment published — students and parents can now see it.");
  } catch (error) { throw error; }
};

export const unpublishAssignment = async (req: Request, res: Response) => {
  try {
    const assignment = await prisma.assignment.update({
      where: { id: req.params.id },
      data: { isPublished: false, publishedAt: null, publishedBy: null },
    });
    await logAudit("UNPUBLISH", "assignments", assignment.id, req.user!.id, null, null, req.ip, req.get("user-agent"));
    return successResponse(res, assignment, "Assignment unpublished.");
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
