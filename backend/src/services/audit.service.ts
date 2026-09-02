import prisma from "../config/database";

export const logAudit = async (
  action: string,
  entity: string,
  entityId: string | null,
  userId: string | null,
  oldData: any = null,
  newData: any = null,
  ipAddress?: string,
  userAgent?: string
) => {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        userId,
        oldData,
        newData,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
};
