import { Router } from "express";
import { getAttendance, getStudentAttendance, markAttendance, getAttendanceStats } from "../controllers/attendance.controller";
import { authenticate, authorizeTeacher } from "../middleware/rbac";

const router = Router();

router.get("/", authenticate, getAttendance);
router.get("/stats", authenticate, getAttendanceStats);
router.get("/student/:studentId", authenticate, getStudentAttendance);
router.post("/mark", authenticate, authorizeTeacher, markAttendance);

export default router;
