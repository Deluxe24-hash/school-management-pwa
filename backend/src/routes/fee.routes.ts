import { Router } from "express";
import { getFeeItems, createFeeItem, getFees, createFee, getStudentFees, getFeeBatches, publishFeeBatch, unpublishFeeBatch } from "../controllers/fee.controller";
import { authenticate, authorizeFinance, authorizeAdmin } from "../middleware/rbac";

const router = Router();

router.get("/items", authenticate, getFeeItems);
router.post("/items", authenticate, authorizeFinance, createFeeItem);
router.get("/", authenticate, authorizeFinance, getFees);
router.post("/", authenticate, authorizeFinance, createFee);
router.get("/batches", authenticate, authorizeFinance, getFeeBatches);
router.post("/publish", authenticate, authorizeAdmin, publishFeeBatch);
router.post("/unpublish", authenticate, authorizeAdmin, unpublishFeeBatch);
router.get("/student/:studentId", authenticate, getStudentFees);

export default router;
