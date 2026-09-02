import { Request, Response } from "express";
import prisma from "../config/database";
import { successResponse, errorResponse } from "../utils/response";
import { logAudit } from "../services/audit.service";

export const getSubjects = async (req: Request, res: Response) => {
  try {
    const subjects = await prisma.subject.findMany({
      include: {
        classSubjects: { include: { class: true, teacher: true } },
        _count: { select: { results: true, assignments: true } },
      },
      orderBy: { name: "asc" },
    });
    return successResponse(res, subjects);
  } catch (error) { throw error; }
};

export const getSubject = async (req: Request, res: Response) => {
  try {
    const subject = await prisma.subject.findUnique({
      where: { id: req.params.id },
      include: {
        classSubjects: { include: { class: true, teacher: true } },
        results: { include: { student: true, session: true, term: true } },
      },
    });
    if (!subject) return errorResponse(res, "Subject not found", 404);
    return successResponse(res, subject);
  } catch (error) { throw error; }
};

export const createSubject = async (req: Request, res: Response) => {
  try {
    const { name, code, category, description } = req.body;
    const subject = await prisma.subject.create({
      data: { name, code: code.toUpperCase(), category, description },
    });
    await logAudit("CREATE", "subjects", subject.id, req.user!.id, null, req.body, req.ip, req.get("user-agent"));
    return successResponse(res, subject, "Subject created", 201);
  } catch (error) { throw error; }
};

export const updateSubject = async (req: Request, res: Response) => {
  try {
    const subject = await prisma.subject.update({
      where: { id: req.params.id },
      data: req.body,
    });
    await logAudit("UPDATE", "subjects", subject.id, req.user!.id, null, req.body, req.ip, req.get("user-agent"));
    return successResponse(res, subject, "Subject updated");
  } catch (error) { throw error; }
};

export const deleteSubject = async (req: Request, res: Response) => {
  try {
    await prisma.subject.delete({ where: { id: req.params.id } });
    await logAudit("DELETE", "subjects", req.params.id, req.user!.id, null, null, req.ip, req.get("user-agent"));
    return successResponse(res, null, "Subject deleted");
  } catch (error) { throw error; }
};
