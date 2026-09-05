import { Router } from "express";
import { generateReportCard, getReportCard } from "../controllers/reportcard.controller";
import { authenticate, authorizeTeacher } from "../middleware/rbac";

const router = Router();

router.get("/", authenticate, getReportCard);
router.post("/generate", authenticate, authorizeTeacher, generateReportCard);

export default router;
