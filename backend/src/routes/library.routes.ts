import { Router } from "express";
import { getBooks, createBook, updateBook, deleteBook, getLoans, borrowBook, returnBook } from "../controllers/library.controller";
import { authenticate, authorizeAdmin } from "../middleware/rbac";

const router = Router();

router.get("/books", authenticate, getBooks);
router.post("/books", authenticate, authorizeAdmin, createBook);
router.put("/books/:id", authenticate, authorizeAdmin, updateBook);
router.delete("/books/:id", authenticate, authorizeAdmin, deleteBook);

router.get("/loans", authenticate, getLoans);
router.post("/loans", authenticate, authorizeAdmin, borrowBook);
router.put("/loans/:id/return", authenticate, authorizeAdmin, returnBook);

export default router;
