import { Request, Response } from "express";
import prisma from "../config/database";
import { successResponse, errorResponse } from "../utils/response";
import { logAudit } from "../services/audit.service";
import { generateReference } from "../utils/helpers";

export const getPayments = async (req: Request, res: Response) => {
  try {
    const { studentId, status, gateway, page = "1", limit = "50" } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (studentId) where.studentId = studentId as string;
    if (status) where.status = status;
    if (gateway) where.gateway = gateway as string;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          student: { select: { firstName: true, lastName: true, admissionNumber: true } },
          fee: { include: { feeItem: true } },
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: "desc" },
      }),
      prisma.payment.count({ where }),
    ]);

    return successResponse(res, { payments, total });
  } catch (error) { throw error; }
};

export const createPayment = async (req: Request, res: Response) => {
  try {
    const { studentId, feeId, amount, gateway } = req.body;

    const payment = await prisma.payment.create({
      data: {
        studentId,
        feeId,
        amount,
        reference: generateReference(),
        gateway,
        status: "PENDING",
      },
      include: { student: true, fee: { include: { feeItem: true } } },
    });

    await logAudit("CREATE", "payments", payment.id, req.user!.id, null, req.body, req.ip, req.get("user-agent"));
    return successResponse(res, payment, "Payment initiated", 201);
  } catch (error) { throw error; }
};

export const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, gatewayRef } = req.body;

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        status,
        gatewayRef,
        paidAt: status === "SUCCESSFUL" ? new Date() : null,
      },
      include: { student: true, fee: { include: { feeItem: true } } },
    });

    await logAudit("VERIFY", "payments", id, req.user!.id, null, { status, gatewayRef }, req.ip, req.get("user-agent"));
    return successResponse(res, payment, "Payment verified");
  } catch (error) { throw error; }
};

export const getPaymentReceipt = async (req: Request, res: Response) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: {
        student: true,
        fee: { include: { feeItem: true, session: true, term: true } },
      },
    });

    if (!payment) return errorResponse(res, "Payment not found", 404);
    if (payment.status !== "SUCCESSFUL") return errorResponse(res, "Payment not successful", 400);

    return successResponse(res, payment);
  } catch (error) { throw error; }
};
