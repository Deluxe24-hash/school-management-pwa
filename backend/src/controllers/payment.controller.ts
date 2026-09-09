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
    const { studentId, feeId, amount, gateway, method, receiptData, submittedNote } = req.body;

    // Parents/students may only submit payments for their own linked child (or themselves).
    const role = req.user!.role;
    const isAdminTier = ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"].includes(role);
    if (!isAdminTier) {
      if (role === "STUDENT" && req.user!.student?.id !== studentId) {
        return errorResponse(res, "You can only pay your own fees.", 403);
      }
      if (role === "PARENT") {
        const parent = await prisma.parent.findUnique({
          where: { id: req.user!.parent?.id },
          select: { children: { select: { id: true } } },
        });
        const allowedIds = new Set((parent?.children || []).map((c) => c.id));
        if (!allowedIds.has(studentId)) {
          return errorResponse(res, "You can only pay fees for your own children.", 403);
        }
      }
    }

    // Manual payment methods (bank transfer / cash deposit) require a receipt and
    // stay PENDING until an admin verifies them; Paystack payments are verified by the gateway.
    if ((method === "BANK_TRANSFER" || method === "CASH_DEPOSIT") && !receiptData) {
      return errorResponse(res, "Please upload a receipt to submit this payment.", 422);
    }

    const payment = await prisma.payment.create({
      data: {
        studentId,
        feeId,
        amount,
        reference: generateReference(),
        gateway,
        method: method || "PAYSTACK",
        receiptData,
        submittedNote,
        status: "PENDING",
      },
      include: { student: true, fee: { include: { feeItem: true } } },
    });

    await logAudit("CREATE", "payments", payment.id, req.user!.id, null, { ...req.body, receiptData: undefined }, req.ip, req.get("user-agent"));
    return successResponse(res, payment, "Payment submitted — awaiting confirmation", 201);
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

    // Admin/finance can view a receipt at any status (they need to see it to approve/reject it).
    // Everyone else can only view their own successful payment's receipt.
    const role = req.user!.role;
    const isAdminTier = ["SUPER_ADMIN", "ADMIN", "ACCOUNTANT"].includes(role);
    if (!isAdminTier && payment.status !== "SUCCESSFUL") {
      return errorResponse(res, "Payment not successful", 400);
    }

    return successResponse(res, payment);
  } catch (error) { throw error; }
};
