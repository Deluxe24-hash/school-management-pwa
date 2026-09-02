import { Request, Response } from "express";
import prisma from "../config/database";
import { successResponse, errorResponse } from "../utils/response";
import { logAudit } from "../services/audit.service";

export const getFeeItems = async (req: Request, res: Response) => {
  try {
    const items = await prisma.feeItem.findMany({ orderBy: { name: "asc" } });
    return successResponse(res, items);
  } catch (error) { throw error; }
};

export const createFeeItem = async (req: Request, res: Response) => {
  try {
    const item = await prisma.feeItem.create({ data: req.body });
    await logAudit("CREATE", "fee_items", item.id, req.user!.id, null, req.body, req.ip, req.get("user-agent"));
    return successResponse(res, item, "Fee item created", 201);
  } catch (error) { throw error; }
};

export const getFees = async (req: Request, res: Response) => {
  try {
    const { studentId, classArmId, sessionId, termId, status, page = "1", limit = "50" } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const where: any = {};
    if (studentId) where.studentId = studentId as string;
    if (classArmId) where.classArmId = classArmId as string;
    if (sessionId) where.sessionId = sessionId as string;
    if (termId) where.termId = termId as string;

    const [fees, total] = await Promise.all([
      prisma.fee.findMany({
        where,
        include: {
          feeItem: true,
          student: { select: { firstName: true, lastName: true, admissionNumber: true } },
          payments: true,
        },
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: "desc" },
      }),
      prisma.fee.count({ where }),
    ]);

    const feesWithBalance = fees.map(f => ({
      ...f,
      totalPaid: f.payments.reduce((sum, p) => p.status === "SUCCESSFUL" ? sum + p.amount : sum, 0),
      balance: f.amount - f.payments.reduce((sum, p) => p.status === "SUCCESSFUL" ? sum + p.amount : sum, 0),
    }));

    return successResponse(res, { fees: feesWithBalance, total });
  } catch (error) { throw error; }
};

export const createFee = async (req: Request, res: Response) => {
  try {
    const { studentIds, feeItemId, amount, classArmId, sessionId, termId } = req.body;

    const fees = await prisma.$transaction(
      studentIds.map((studentId: string) =>
        prisma.fee.create({
          data: { studentId, feeItemId, amount, classArmId, sessionId, termId },
          include: { feeItem: true, student: true },
        })
      )
    );

    await logAudit("CREATE", "fees", null, req.user!.id, null, { count: fees.length }, req.ip, req.get("user-agent"));
    return successResponse(res, fees, "Fees created", 201);
  } catch (error) { throw error; }
};

export const getStudentFees = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { sessionId, termId } = req.query;

    const where: any = { studentId };
    if (sessionId) where.sessionId = sessionId as string;
    if (termId) where.termId = termId as string;

    const fees = await prisma.fee.findMany({
      where,
      include: { feeItem: true, payments: true },
      orderBy: { createdAt: "desc" },
    });

    const totalBill = fees.reduce((sum, f) => sum + f.amount, 0);
    const totalPaid = fees.reduce((sum, f) => sum + f.payments.filter(p => p.status === "SUCCESSFUL").reduce((s, p) => s + p.amount, 0), 0);

    return successResponse(res, { fees, totalBill, totalPaid, balance: totalBill - totalPaid });
  } catch (error) { throw error; }
};
