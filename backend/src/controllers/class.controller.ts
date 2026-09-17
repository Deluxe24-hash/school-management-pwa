import { Request, Response } from "express";
import prisma from "../config/database";
import { successResponse, errorResponse } from "../utils/response";
import { logAudit } from "../services/audit.service";
import { getTeacherScope } from "../utils/helpers";

export const getClasses = async (req: Request, res: Response) => {
  try {
    const role = req.user!.role;
    const isAdminTier = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(role);
    const requesterTeacherId = req.user!.teacher?.id;

    const armWhere: any = {};
    if (!isAdminTier && requesterTeacherId) {
      const scope = await getTeacherScope(prisma, requesterTeacherId);
      armWhere.id = { in: scope.allClassArmIds };
    }

    const classes = await prisma.class.findMany({
      include: {
        arms: {
          where: Object.keys(armWhere).length ? armWhere : undefined,
          include: {
            classTeacher: { include: { user: { select: { email: true } } } },
            _count: { select: { enrollments: true } },
          },
        },
        subjects: { include: { subject: true, teacher: true } },
      },
      orderBy: { name: "asc" },
    });

    // A teacher's class list should only show classes that actually have a matching arm
    // left after scoping — otherwise every class shows up with an empty arms array.
    const filtered = !isAdminTier && requesterTeacherId ? classes.filter((c) => c.arms.length > 0) : classes;

    return successResponse(res, filtered);
  } catch (error) { throw error; }
};

export const getClass = async (req: Request, res: Response) => {
  try {
    const role = req.user!.role;
    const isAdminTier = ["SUPER_ADMIN", "ADMIN", "PRINCIPAL"].includes(role);
    const requesterTeacherId = req.user!.teacher?.id;

    let allowedArmIds: string[] | null = null;
    if (!isAdminTier && requesterTeacherId) {
      const scope = await getTeacherScope(prisma, requesterTeacherId);
      allowedArmIds = scope.allClassArmIds;
    }

    const cls = await prisma.class.findUnique({
      where: { id: req.params.id },
      include: {
        arms: {
          where: allowedArmIds ? { id: { in: allowedArmIds } } : undefined,
          include: { classTeacher: true, _count: { select: { enrollments: true } } },
        },
        subjects: { include: { subject: true, teacher: true } },
        timetables: { include: { subject: true, teacher: true, classArm: true } },
      },
    });
    if (!cls) return errorResponse(res, "Class not found", 404);
    if (allowedArmIds && cls.arms.length === 0) {
      return errorResponse(res, "You're not assigned to any arm of this class.", 403);
    }
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
