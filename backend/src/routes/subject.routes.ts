import { Router } from "express";
import { getSubjects, getSubject, createSubject, updateSubject, deleteSubject } from "../controllers/subject.controller";
import { authenticate, authorizeAdmin } from "../middleware/rbac";

const router = Router();

router.get("/", authenticate, getSubjects);
router.get("/:id", authenticate, getSubject);
router.post("/", authenticate, authorizeAdmin, createSubject);
router.put("/:id", authenticate, authorizeAdmin, updateSubject);
router.delete("/:id", authenticate, authorizeAdmin, deleteSubject);

export default router;
