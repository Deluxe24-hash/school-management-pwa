import { Router } from "express";
import { getSettings, updateSettings } from "../controllers/setting.controller";
import { authenticate, authorizeAdmin } from "../middleware/rbac";

const router = Router();

router.get("/", authenticate, getSettings);
router.put("/", authenticate, authorizeAdmin, updateSettings);

export default router;
