import { Router } from "express";
import { getSubjectPerformance, getAttendanceTrend, getAssignmentCompletion } from "../controllers/analytics.controller";
import { authenticate, authorizeTeacher } from "../middleware/rbac";

const router = Router();

router.get("/subject-performance", authenticate, authorizeTeacher, getSubjectPerformance);
router.get("/attendance-trend", authenticate, authorizeTeacher, getAttendanceTrend);
router.get("/assignment-completion", authenticate, authorizeTeacher, getAssignmentCompletion);

export default router;
