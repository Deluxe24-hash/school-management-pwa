import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import prisma from "../config/database";
import { successResponse, errorResponse } from "../utils/response";
import { logAudit } from "../services/audit.service";

const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Valid email is required"),
    password: z.string().min(1, "Password is required"),
  }),
});

const registerSchema = z.object({
  body: z.object({
    email: z.string().email("Valid email is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["SUPER_ADMIN", "ADMIN", "PRINCIPAL", "HEAD_TEACHER", "TEACHER", "ACCOUNTANT", "STUDENT", "PARENT"]),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    phone: z.string().optional(),
  }),
});

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req).body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        student: { include: { parent: true } },
        teacher: true,
        parent: { include: { children: true } },
        staff: true,
      },
    });

    if (!user) {
      return errorResponse(res, "Invalid credentials", 401);
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return errorResponse(res, "Invalid credentials", 401);
    }

    if (user.status !== "ACTIVE") {
      return errorResponse(res, "Account is inactive or suspended", 403);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as jwt.SignOptions["expiresIn"] }
    );

    await logAudit("LOGIN", "users", user.id, user.id, null, null, req.ip, req.get("user-agent"));

    const { password: _, ...userWithoutPassword } = user;

    return successResponse(res, { user: userWithoutPassword, token }, "Login successful");
  } catch (error) {
    throw error;
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, role, firstName, lastName, phone } = registerSchema.parse(req).body;

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return errorResponse(res, "Email already registered", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        role,
      },
    });

    // Create role-specific profile
    if (role === "STUDENT") {
      await prisma.student.create({
        data: {
          userId: user.id,
          admissionNumber: `ADM/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
          firstName,
          lastName,
          gender: "OTHER",
        },
      });
    } else if (role === "TEACHER") {
      await prisma.teacher.create({
        data: {
          userId: user.id,
          teacherId: `TCH/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
          firstName,
          lastName,
          gender: "OTHER",
          phone: phone || "",
        },
      });
    } else if (role === "PARENT") {
      await prisma.parent.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
          phone: phone || "",
        },
      });
    } else {
      await prisma.staff.create({
        data: {
          userId: user.id,
          staffId: `STF/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
          firstName,
          lastName,
          gender: "OTHER",
          phone: phone || "",
        },
      });
    }

    await logAudit("CREATE", "users", user.id, user.id, null, { email, role }, req.ip, req.get("user-agent"));

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as jwt.SignOptions["expiresIn"] }
    );

    const { password: _, ...userWithoutPassword } = user;
    return successResponse(res, { user: userWithoutPassword, token }, "Registration successful", 201);
  } catch (error) {
    throw error;
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        student: { include: { parent: true, enrollments: { include: { classArm: { include: { class: true } } } } } },
        teacher: { include: { classArms: { include: { class: true } }, classSubjects: { include: { subject: true, class: true } } } },
        parent: { include: { children: { include: { enrollments: { include: { classArm: { include: { class: true } } } } } } } },
        staff: true,
      },
    });

    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    const { password: _, ...userWithoutPassword } = user;
    return successResponse(res, userWithoutPassword);
  } catch (error) {
    throw error;
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) return errorResponse(res, "User not found", 404);

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return errorResponse(res, "Current password is incorrect", 400);

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    await logAudit("UPDATE", "users", user.id, user.id, null, { action: "password_changed" }, req.ip, req.get("user-agent"));

    return successResponse(res, null, "Password changed successfully");
  } catch (error) {
    throw error;
  }
};
