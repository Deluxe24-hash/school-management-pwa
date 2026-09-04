import { Router } from "express";
import { getTeachers, getTeacher, createTeacher, updateTeacher, deleteTeacher, assignSubject } from "../controllers/teacher.controller";
import { authenticate, authorizeAdmin } from "../middleware/rbac";

const router = Router();

router.get("/", authenticate, getTeachers);
router.get("/:id", authenticate, getTeacher);
router.post("/", authenticate, authorizeAdmin, createTeacher);
router.put("/:id", authenticate, authorizeAdmin, updateTeacher);
router.delete("/:id", authenticate, authorizeAdmin, deleteTeacher);
router.post("/assign-subject", authenticate, authorizeAdmin, assignSubject);

export default router;
