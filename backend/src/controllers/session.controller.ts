import { Request, Response } from "express";
import prisma from "../config/database";
import { successResponse, errorResponse } from "../utils/response";
import { logAudit } from "../services/audit.service";

export const getSessions = async (req: Request, res: Response) => {
  try {
    const sessions = await prisma.academicSession.findMany({
      include: { terms: true },
      orderBy: { startDate: "desc" },
    });
    return successResponse(res, sessions);
  } catch (error) { throw error; }
};

export const getCurrentSession = async (req: Request, res: Response) => {
  try {
    const session = await prisma.academicSession.findFirst({
      where: { isCurrent: true },
      include: { terms: true },
    });
    if (!session) return errorResponse(res, "No active session", 404);
    return successResponse(res, session);
  } catch (error) { throw error; }
};

export const createSession = async (req: Request, res: Response) => {
  try {
    const { name, startDate, endDate } = req.body;
    const session = await prisma.academicSession.create({
      data: { name, startDate: new Date(startDate), endDate: new Date(endDate) },
    });

    // Auto-create terms
    const terms = ["First Term", "Second Term", "Third Term"];
    const termDuration = Math.floor((new Date(endDate).getTime() - new Date(startDate).getTime()) / 3);

    for (let i = 0; i < 3; i++) {
      const termStart = new Date(new Date(startDate).getTime() + i * termDuration);
      const termEnd = new Date(termStart.getTime() + termDuration - 86400000);
      await prisma.term.create({
        data: {
          name: terms[i],
          startDate: termStart,
          endDate: termEnd,
          sessionId: session.id,
        },
      });
    }

    await logAudit("CREATE", "academic_sessions", session.id, req.user!.id, null, req.body, req.ip, req.get("user-agent"));
    return successResponse(res, session, "Session created", 201);
  } catch (error) { throw error; }
};

export const setCurrentSession = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.academicSession.updateMany({ data: { isCurrent: false } });
    const session = await prisma.academicSession.update({
      where: { id },
      data: { status: "ACTIVE", isCurrent: true },
    });
    await logAudit("ACTIVATE", "academic_sessions", id, req.user!.id, null, null, req.ip, req.get("user-agent"));
    return successResponse(res, session, "Session activated");
  } catch (error) { throw error; }
};

export const updateTerm = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, isCurrent } = req.body;

    if (isCurrent) {
      await prisma.term.updateMany({ data: { isCurrent: false } });
    }

    const term = await prisma.term.update({
      where: { id },
      data: { status, isCurrent },
    });

    await logAudit("UPDATE", "terms", id, req.user!.id, null, req.body, req.ip, req.get("user-agent"));
    return successResponse(res, term, "Term updated");
  } catch (error) { throw error; }
};
