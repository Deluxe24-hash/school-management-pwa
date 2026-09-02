import { Request, Response } from "express";
import prisma from "../config/database";
import { successResponse, errorResponse } from "../utils/response";
import { logAudit } from "../services/audit.service";

export const getTeachers = async (req: Request, res: Response) => {
  try {
    const { search, department, page = "1", limit = "20" } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: "insensitive" } },
        { lastName: { contains: search as string, mode: "insensitive" } },
        { teacherId: { contains: search as string, mode: "insensitive" } },
      ];
    }
    if (department) where.department = department;

    const [teachers, total] = await Promise.all([
      prisma.teacher.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, status: true } },
          classArms: { include: { class: true } },
          classSubjects: { include: { subject: true, class: true } },
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: "desc" },
      }),
      prisma.teacher.count({ where }),
    ]);

    return successResponse(res, { teachers, total, page: parseInt(page as string), totalPages: Math.ceil(total / parseInt(limit as string)) });
  } catch (error) { throw error; }
};

export const getTeacher = async (req: Request, res: Response) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, email: true, status: true } },
        classArms: { include: { class: true } },
        classSubjects: { include: { subject: true, class: true } },
        timetables: { include: { subject: true, class: true, classArm: true } },
      },
    });
    if (!teacher) return errorResponse(res, "Teacher not found", 404);
    return successResponse(res, teacher);
  } catch (error) { throw error; }
};

export const createTeacher = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, gender, email, phone, qualification, department, dateEmployed } = req.body;

    const bcrypt = require("bcryptjs");
    const password = await bcrypt.hash("Teacher@123", 12);

    const user = await prisma.user.create({
      data: { email: email.toLowerCase(), password, role: "TEACHER" },
    });

    const teacher = await prisma.teacher.create({
      data: {
        userId: user.id,
        teacherId: `TCH/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
        firstName, lastName, gender, phone, qualification, department,
        dateEmployed: dateEmployed ? new Date(dateEmployed) : null,
      },
      include: { user: true },
    });

    await logAudit("CREATE", "teachers", teacher.id, req.user!.id, null, req.body, req.ip, req.get("user-agent"));
    return successResponse(res, teacher, "Teacher created", 201);
  } catch (error) { throw error; }
};

export const updateTeacher = async (req: Request, res: Response) => {
  try {
    const teacher = await prisma.teacher.update({
      where: { id: req.params.id },
      data: req.body,
      include: { user: true },
    });
    await logAudit("UPDATE", "teachers", teacher.id, req.user!.id, null, req.body, req.ip, req.get("user-agent"));
    return successResponse(res, teacher, "Teacher updated");
  } catch (error) { throw error; }
};

export const assignSubject = async (req: Request, res: Response) => {
  try {
    const { teacherId, classId, subjectId } = req.body;
    const assignment = await prisma.classSubject.create({
      data: { classId, subjectId, teacherId },
      include: { class: true, subject: true, teacher: true },
    });
    await logAudit("ASSIGN", "class_subjects", assignment.id, req.user!.id, null, req.body, req.ip, req.get("user-agent"));
    return successResponse(res, assignment, "Subject assigned", 201);
  } catch (error) { throw error; }
};
