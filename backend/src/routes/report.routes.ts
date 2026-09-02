import { Router } from "express";
import { getDashboardStats, getStudentReport, getClassPerformance } from "../controllers/report.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.get("/dashboard", authenticate, getDashboardStats);
router.get("/student/:studentId", authenticate, getStudentReport);
router.get("/class-performance", authenticate, getClassPerformance);

export default router;
