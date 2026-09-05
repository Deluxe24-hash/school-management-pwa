import { Router } from "express";
import { getInbox, getSent, sendMessage, markMessageRead, getContacts } from "../controllers/message.controller";
import { authenticate } from "../middleware/rbac";

const router = Router();

router.get("/inbox", authenticate, getInbox);
router.get("/sent", authenticate, getSent);
router.get("/contacts", authenticate, getContacts);
router.post("/", authenticate, sendMessage);
router.put("/:id/read", authenticate, markMessageRead);

export default router;
