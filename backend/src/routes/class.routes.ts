import { Router } from "express";
import { getClasses, getClass, createClass, createClassArm, updateClassArm } from "../controllers/class.controller";
import { authenticate, authorizeAdmin } from "../middleware/rbac";

const router = Router();

router.get("/", authenticate, getClasses);
router.get("/:id", authenticate, getClass);
router.post("/", authenticate, authorizeAdmin, createClass);
router.post("/arms", authenticate, authorizeAdmin, createClassArm);
router.put("/arms/:id", authenticate, authorizeAdmin, updateClassArm);

export default router;
