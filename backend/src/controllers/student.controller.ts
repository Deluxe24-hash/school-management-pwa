import { Request, Response } from "express";
import { z } from "zod";
import prisma from "../config/database";
import { successResponse, errorResponse } from "../utils/response";
import { logAudit } from "../services/audit.service";
import { generateAdmissionNumber } from "../utils/helpers";

const studentSchema = z.object({
  body: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    middleName: z.string().optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]),
    dateOfBirth: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    emergencyContact: z.string().optional(),
    emergencyPhone: z.string().optional(),
    medicalInfo: z.string().optional(),
    previousSchool: z.string().optional(),
    parentId: z.string().optional(),
    classArmId: z.string().optional(),
    email: z.string().email().optional(),
  }),
});

export const getStudents = async (req: Request, res: Response) => {
  try {
    const { search, classArmId, gender, status, page = "1", limit = "20" } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: "insensitive" } },
        { lastName: { contains: search as string, mode: "insensitive" } },
        { admissionNumber: { contains: search as string, mode: "insensitive" } },
      ];
    }
    if (gender) where.gender = gender;
    if (status) where.academicStatus = status;
    if (classArmId) {
      where.enrollments = { some: { classArmId: classArmId as string } };
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, status: true } },
          parent: true,
          enrollments: {
            include: { classArm: { include: { class: true } } },
            orderBy: { enrolledAt: "desc" },
            take: 1,
          },
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: "desc" },
      }),
      prisma.student.count({ where }),
    ]);

    return successResponse(res, { students, total, page: parseInt(page as string), totalPages: Math.ceil(total / parseInt(limit as string)) });
  } catch (error) {
    throw error;
  }
};

export const getStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, status: true, role: true } },
        parent: true,
        enrollments: {
          include: { classArm: { include: { class: true } } },
          orderBy: { enrolledAt: "desc" },
        },
        attendances: { orderBy: { date: "desc" }, take: 30 },
        results: {
          include: { subject: true, session: true, term: true },
          orderBy: { createdAt: "desc" },
        },
        fees: {
          include: { feeItem: true, payments: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!student) return errorResponse(res, "Student not found", 404);
    return successResponse(res, student);
  } catch (error) {
    throw error;
  }
};

export const createStudent = async (req: Request, res: Response) => {
  try {
    const data = studentSchema.parse(req).body;

    // Create user account if email provided
    let userId: string | undefined;
    if (data.email) {
      const bcrypt = require("bcryptjs");
      const password = await bcrypt.hash("Student@123", 12);
      const user = await prisma.user.create({
        data: {
          email: data.email.toLowerCase(),
          password,
          role: "STUDENT",
        },
      });
      userId = user.id;
    }

    const student = await prisma.student.create({
      data: {
        admissionNumber: generateAdmissionNumber(),
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        address: data.address,
        phone: data.phone,
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone,
        medicalInfo: data.medicalInfo,
        previousSchool: data.previousSchool,
        parentId: data.parentId,
        ...(userId ? { userId } : {}),
      },
      include: { user: true, parent: true },
    });

    // Auto-enroll if classArmId provided
    if (data.classArmId) {
      const currentSession = await prisma.academicSession.findFirst({
        where: { isCurrent: true },
      });
      if (currentSession) {
        await prisma.studentEnrollment.create({
          data: {
            studentId: student.id,
            classArmId: data.classArmId,
            sessionId: currentSession.id,
          },
        });
      }
    }

    await logAudit("CREATE", "students", student.id, req.user!.id, null, data, req.ip, req.get("user-agent"));

    return successResponse(res, student, "Student created successfully", 201);
  } catch (error) {
    throw error;
  }
};

export const updateStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = studentSchema.parse(req).body;

    const existing = await prisma.student.findUnique({ where: { id } });
    if (!existing) return errorResponse(res, "Student not found", 404);

    const student = await prisma.student.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : existing.dateOfBirth,
        address: data.address,
        phone: data.phone,
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone,
        medicalInfo: data.medicalInfo,
        previousSchool: data.previousSchool,
        parentId: data.parentId,
      },
      include: { user: true, parent: true },
    });

    await logAudit("UPDATE", "students", id, req.user!.id, existing, student, req.ip, req.get("user-agent"));

    return successResponse(res, student, "Student updated successfully");
  } catch (error) {
    throw error;
  }
};

export const deleteStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.student.findUnique({ where: { id } });
    if (!existing) return errorResponse(res, "Student not found", 404);

    await prisma.student.update({
      where: { id },
      data: { academicStatus: "WITHDRAWN" },
    });

    await logAudit("DELETE", "students", id, req.user!.id, existing, null, req.ip, req.get("user-agent"));

    return successResponse(res, null, "Student withdrawn successfully");
  } catch (error) {
    throw error;
  }
};

export const promoteStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { classArmId, sessionId } = req.body;

    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) return errorResponse(res, "Student not found", 404);

    await prisma.studentEnrollment.create({
      data: {
        studentId: id,
        classArmId,
        sessionId,
      },
    });

    await prisma.student.update({
      where: { id },
      data: { academicStatus: "PROMOTED" },
    });

    await logAudit("PROMOTE", "students", id, req.user!.id, null, { classArmId, sessionId }, req.ip, req.get("user-agent"));

    return successResponse(res, null, "Student promoted successfully");
  } catch (error) {
    throw error;
  }
};
