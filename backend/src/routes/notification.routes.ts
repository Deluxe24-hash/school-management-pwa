import { Router } from "express";
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "../controllers/notification.controller";
import { authenticate } from "../middleware/rbac";

const router = Router();

router.get("/", authenticate, getNotifications);
router.put("/:id/read", authenticate, markNotificationRead);
router.put("/read-all", authenticate, markAllNotificationsRead);

export default router;
