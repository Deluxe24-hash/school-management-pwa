import { Router } from "express";
import { getStudents, getStudent, createStudent, updateStudent, deleteStudent, promoteStudent } from "../controllers/student.controller";
import { authenticate, authorizeAdmin } from "../middleware/rbac";

const router = Router();

router.get("/", authenticate, getStudents);
router.get("/:id", authenticate, getStudent);
router.post("/", authenticate, authorizeAdmin, createStudent);
router.put("/:id", authenticate, authorizeAdmin, updateStudent);
router.delete("/:id", authenticate, authorizeAdmin, deleteStudent);
router.post("/:id/promote", authenticate, authorizeAdmin, promoteStudent);

export default router;
