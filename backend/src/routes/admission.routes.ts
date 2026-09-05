import { Router } from "express";
import { submitApplication, getApplications, reviewApplication, acceptApplication } from "../controllers/admission.controller";
import { authenticate, authorizeAdmin } from "../middleware/rbac";

const router = Router();

// Public — prospective families submit here with no login.
router.post("/apply", submitApplication);

router.get("/", authenticate, authorizeAdmin, getApplications);
router.put("/:id/review", authenticate, authorizeAdmin, reviewApplication);
router.post("/:id/accept", authenticate, authorizeAdmin, acceptApplication);

export default router;
