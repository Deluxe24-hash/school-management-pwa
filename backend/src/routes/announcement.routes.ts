import { Router } from "express";
import { getAnnouncements, getAnnouncement, createAnnouncement, updateAnnouncement, deleteAnnouncement } from "../controllers/announcement.controller";
import { authenticate, authorizeAdmin } from "../middleware/rbac";

const router = Router();

router.get("/", authenticate, getAnnouncements);
router.get("/:id", authenticate, getAnnouncement);
router.post("/", authenticate, authorizeAdmin, createAnnouncement);
router.put("/:id", authenticate, authorizeAdmin, updateAnnouncement);
router.delete("/:id", authenticate, authorizeAdmin, deleteAnnouncement);

export default router;
