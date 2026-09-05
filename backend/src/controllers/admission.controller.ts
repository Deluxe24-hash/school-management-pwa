import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../config/database";
import { successResponse, errorResponse } from "../utils/response";
import { logAudit } from "../services/audit.service";
import { generateAdmissionNumber } from "../utils/helpers";

// Public — no authentication required, this is the front door for prospective families.
export const submitApplication = async (req: Request, res: Response) => {
  try {
    const {
      firstName, lastName, middleName, gender, dateOfBirth,
      classAppliedFor, previousSchool, parentName, parentPhone, parentEmail, address,
    } = req.body;

    if (!firstName || !lastName || !gender || !classAppliedFor || !parentName || !parentPhone) {
      return errorResponse(res, "Please fill in all required fields.", 422);
    }

    const application = await prisma.application.create({
      data: {
        firstName, lastName, middleName, gender,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        classAppliedFor, previousSchool, parentName, parentPhone, parentEmail, address,
      },
    });
    return successResponse(res, { id: application.id }, "Application submitted — the school will contact you soon.", 201);
  } catch (error) { throw error; }
};

export const getApplications = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const where: any = status ? { status } : {};
    const applications = await prisma.application.findMany({ where, orderBy: { submittedAt: "desc" } });
    return successResponse(res, applications);
  } catch (error) { throw error; }
};

export const reviewApplication = async (req: Request, res: Response) => {
  try {
    const { status, notes } = req.body; // UNDER_REVIEW | REJECTED (use /accept for ACCEPTED)
    const application = await prisma.application.update({
      where: { id: req.params.id },
      data: { status, notes, reviewedAt: new Date(), reviewedBy: req.user!.id },
    });
    await logAudit("UPDATE", "applications", application.id, req.user!.id, null, { status }, req.ip, req.get("user-agent"));
    return successResponse(res, application, "Application updated");
  } catch (error) { throw error; }
};

// Accepting an application creates the actual Student + linked User account,
// so the admin doesn't have to re-type everything into the Students module.
export const acceptApplication = async (req: Request, res: Response) => {
  try {
    const application = await prisma.application.findUnique({ where: { id: req.params.id } });
    if (!application) return errorResponse(res, "Application not found", 404);
    if (application.status === "ACCEPTED") return errorResponse(res, "This application was already accepted.", 422);

    const admissionNumber = generateAdmissionNumber();
    const email = `${admissionNumber.replace(/\//g, "").toLowerCase()}@students.local`;
    const password = await bcrypt.hash("Student@123", 12);

    const user = await prisma.user.create({ data: { email, password, role: "STUDENT" } });
    const student = await prisma.student.create({
      data: {
        admissionNumber,
        firstName: application.firstName,
        lastName: application.lastName,
        middleName: application.middleName,
        gender: application.gender,
        dateOfBirth: application.dateOfBirth,
        address: application.address,
        previousSchool: application.previousSchool,
        userId: user.id,
      },
    });

    const updated = await prisma.application.update({
      where: { id: req.params.id },
      data: { status: "ACCEPTED", reviewedAt: new Date(), reviewedBy: req.user!.id },
    });

    await logAudit("ACCEPT", "applications", updated.id, req.user!.id, null, { studentId: student.id }, req.ip, req.get("user-agent"));
    return successResponse(res, { application: updated, student }, "Application accepted and student enrolled", 201);
  } catch (error) { throw error; }
};
