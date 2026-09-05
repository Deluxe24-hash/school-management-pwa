import { Router } from "express";
import { getTimetable, createTimetableEntry, deleteTimetableEntry } from "../controllers/timetable.controller";
import { authenticate, authorizeAdmin } from "../middleware/rbac";

const router = Router();

router.get("/", authenticate, getTimetable);
router.post("/", authenticate, authorizeAdmin, createTimetableEntry);
router.delete("/:id", authenticate, authorizeAdmin, deleteTimetableEntry);

export default router;
