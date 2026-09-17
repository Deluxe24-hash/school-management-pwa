import { Router } from "express";
import { getResults, getStudentResults, enterResult, lockResults, unlockResults, processResults } from "../controllers/result.controller";
import { authenticate, authorizeTeacher, authorizeAdmin } from "../middleware/rbac";

const router = Router();

router.get("/", authenticate, authorizeTeacher, getResults);
router.get("/student/:studentId", authenticate, getStudentResults);
router.post("/enter", authenticate, authorizeTeacher, enterResult);
router.post("/lock", authenticate, authorizeTeacher, lockResults);
router.post("/unlock", authenticate, authorizeTeacher, unlockResults);
router.post("/process", authenticate, authorizeAdmin, processResults);

export default router;
