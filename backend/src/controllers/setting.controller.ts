import { Request, Response } from "express";
import prisma from "../config/database";
import { successResponse, errorResponse } from "../utils/response";
import { logAudit } from "../services/audit.service";

export const getSettings = async (req: Request, res: Response) => {
  try {
    const settings = await prisma.schoolSetting.findFirst();
    return successResponse(res, settings);
  } catch (error) { throw error; }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.schoolSetting.findFirst();
    let settings;

    if (existing) {
      settings = await prisma.schoolSetting.update({
        where: { id: existing.id },
        data: req.body,
      });
    } else {
      settings = await prisma.schoolSetting.create({ data: req.body });
    }

    await logAudit("UPDATE", "school_settings", settings.id, req.user!.id, existing, settings, req.ip, req.get("user-agent"));
    return successResponse(res, settings, "Settings updated");
  } catch (error) { throw error; }
};
