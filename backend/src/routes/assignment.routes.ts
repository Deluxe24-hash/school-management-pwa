import { Router } from "express";
import { getAssignments, getAssignment, createAssignment, submitAssignment, gradeSubmission } from "../controllers/assignment.controller";
import { authenticate, authorizeTeacher } from "../middleware/rbac";

const router = Router();

router.get("/", authenticate, getAssignments);
router.get("/:id", authenticate, getAssignment);
router.post("/", authenticate, authorizeTeacher, createAssignment);
router.post("/submit", authenticate, submitAssignment);
router.post("/grade", authenticate, authorizeTeacher, gradeSubmission);

export default router;
