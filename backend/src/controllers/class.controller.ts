import { Request, Response } from "express";
import prisma from "../config/database";
import { successResponse, errorResponse } from "../utils/response";
import { logAudit } from "../services/audit.service";

export const getClasses = async (req: Request, res: Response) => {
  try {
    const classes = await prisma.class.findMany({
      include: {
        arms: {
          include: {
            classTeacher: { include: { user: { select: { email: true } } } },
            _count: { select: { enrollments: true } },
          },
        },
        subjects: { include: { subject: true, teacher: true } },
      },
      orderBy: { name: "asc" },
    });
    return successResponse(res, classes);
  } catch (error) { throw error; }
};

export const getClass = async (req: Request, res: Response) => {
  try {
    const cls = await prisma.class.findUnique({
      where: { id: req.params.id },
      include: {
        arms: { include: { classTeacher: true, _count: { select: { enrollments: true } } } },
        subjects: { include: { subject: true, teacher: true } },
        timetables: { include: { subject: true, teacher: true, classArm: true } },
      },
    });
    if (!cls) return errorResponse(res, "Class not found", 404);
    return successResponse(res, cls);
  } catch (error) { throw error; }
};

export const createClass = async (req: Request, res: Response) => {
  try {
    const { name, level, description } = req.body;
    const cls = await prisma.class.create({
      data: { name, level, description },
    });
    await logAudit("CREATE", "classes", cls.id, req.user!.id, null, req.body, req.ip, req.get("user-agent"));
    return successResponse(res, cls, "Class created", 201);
  } catch (error) { throw error; }
};

export const createClassArm = async (req: Request, res: Response) => {
  try {
    const { classId, name, classTeacherId } = req.body;
    const cls = await prisma.class.findUnique({ where: { id: classId } });
    if (!cls) return errorResponse(res, "Class not found", 404);

    const arm = await prisma.classArm.create({
      data: { classId, name, fullName: `${cls.name} ${name}`, classTeacherId },
      include: { class: true, classTeacher: true },
    });
    await logAudit("CREATE", "class_arms", arm.id, req.user!.id, null, req.body, req.ip, req.get("user-agent"));
    return successResponse(res, arm, "Class arm created", 201);
  } catch (error) { throw error; }
};

export const updateClassArm = async (req: Request, res: Response) => {
  try {
    const arm = await prisma.classArm.update({
      where: { id: req.params.id },
      data: req.body,
      include: { class: true, classTeacher: true },
    });
    await logAudit("UPDATE", "class_arms", arm.id, req.user!.id, null, req.body, req.ip, req.get("user-agent"));
    return successResponse(res, arm, "Class arm updated");
  } catch (error) { throw error; }
};
