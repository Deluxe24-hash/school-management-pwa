import { Router } from "express";
import {
  getAssignments, getAssignment, createAssignment, updateAssignment, deleteAssignment,
  publishAssignment, unpublishAssignment, submitAssignment, gradeSubmission,
} from "../controllers/assignment.controller";
import { authenticate, authorizeTeacher, authorizeAdmin } from "../middleware/rbac";

const router = Router();

router.get("/", authenticate, getAssignments);
router.get("/:id", authenticate, getAssignment);
router.post("/", authenticate, authorizeTeacher, createAssignment);
router.put("/:id", authenticate, authorizeAdmin, updateAssignment);
router.delete("/:id", authenticate, authorizeTeacher, deleteAssignment);
router.post("/:id/publish", authenticate, authorizeAdmin, publishAssignment);
router.post("/:id/unpublish", authenticate, authorizeAdmin, unpublishAssignment);
router.post("/submit", authenticate, submitAssignment);
router.post("/grade", authenticate, authorizeTeacher, gradeSubmission);

export default router;
