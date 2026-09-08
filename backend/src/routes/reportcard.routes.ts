import { Router } from "express";
import { generateReportCard, getReportCard, publishReportCard, unpublishReportCard } from "../controllers/reportcard.controller";
import { authenticate, authorizeTeacher, authorizeAdmin } from "../middleware/rbac";

const router = Router();

router.get("/", authenticate, getReportCard);
router.post("/generate", authenticate, authorizeTeacher, generateReportCard);
router.post("/publish", authenticate, authorizeAdmin, publishReportCard);
router.post("/unpublish", authenticate, authorizeAdmin, unpublishReportCard);

export default router;
