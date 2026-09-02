import { Router } from "express";
import { login, register, me, changePassword } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/login", login);
router.post("/register", register);
router.get("/me", authenticate, me);
router.post("/change-password", authenticate, changePassword);

export default router;
