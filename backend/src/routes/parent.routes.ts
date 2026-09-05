import { Router } from "express";
import { getParents, getParent, createParent, updateParent, deleteParent } from "../controllers/parent.controller";
import { authenticate, authorizeAdmin } from "../middleware/rbac";

const router = Router();

router.get("/", authenticate, authorizeAdmin, getParents);
router.get("/:id", authenticate, authorizeAdmin, getParent);
router.post("/", authenticate, authorizeAdmin, createParent);
router.put("/:id", authenticate, authorizeAdmin, updateParent);
router.delete("/:id", authenticate, authorizeAdmin, deleteParent);

export default router;
