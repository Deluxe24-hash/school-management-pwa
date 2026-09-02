import { Router } from "express";
import { getPayments, createPayment, verifyPayment, getPaymentReceipt } from "../controllers/payment.controller";
import { authenticate, authorizeFinance } from "../middleware/rbac";

const router = Router();

router.get("/", authenticate, authorizeFinance, getPayments);
router.post("/", authenticate, createPayment);
router.post("/:id/verify", authenticate, authorizeFinance, verifyPayment);
router.get("/:id/receipt", authenticate, getPaymentReceipt);

export default router;
