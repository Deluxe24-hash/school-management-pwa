import { Router } from "express";
import authRoutes from "./auth.routes";
import studentRoutes from "./student.routes";
import teacherRoutes from "./teacher.routes";
import classRoutes from "./class.routes";
import subjectRoutes from "./subject.routes";
import sessionRoutes from "./session.routes";
import attendanceRoutes from "./attendance.routes";
import resultRoutes from "./result.routes";
import feeRoutes from "./fee.routes";
import paymentRoutes from "./payment.routes";
import assignmentRoutes from "./assignment.routes";
import announcementRoutes from "./announcement.routes";
import settingRoutes from "./setting.routes";
import reportRoutes from "./report.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/students", studentRoutes);
router.use("/teachers", teacherRoutes);
router.use("/classes", classRoutes);
router.use("/subjects", subjectRoutes);
router.use("/sessions", sessionRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/results", resultRoutes);
router.use("/fees", feeRoutes);
router.use("/payments", paymentRoutes);
router.use("/assignments", assignmentRoutes);
router.use("/announcements", announcementRoutes);
router.use("/settings", settingRoutes);
router.use("/reports", reportRoutes);

export default router;
