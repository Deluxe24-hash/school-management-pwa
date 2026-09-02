import { Router } from "express";
import { getSessions, getCurrentSession, createSession, setCurrentSession, updateTerm } from "../controllers/session.controller";
import { authenticate, authorizeAdmin } from "../middleware/rbac";

const router = Router();

router.get("/", authenticate, getSessions);
router.get("/current", authenticate, getCurrentSession);
router.post("/", authenticate, authorizeAdmin, createSession);
router.post("/:id/set-current", authenticate, authorizeAdmin, setCurrentSession);
router.put("/terms/:id", authenticate, authorizeAdmin, updateTerm);

export default router;
