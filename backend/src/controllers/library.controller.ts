import { Request, Response } from "express";
import prisma from "../config/database";
import { successResponse, errorResponse } from "../utils/response";
import { logAudit } from "../services/audit.service";

export const getBooks = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const where: any = search
      ? { OR: [{ title: { contains: search as string, mode: "insensitive" } }, { author: { contains: search as string, mode: "insensitive" } }] }
      : {};
    const books = await prisma.book.findMany({ where, orderBy: { title: "asc" } });
    return successResponse(res, books);
  } catch (error) { throw error; }
};

export const createBook = async (req: Request, res: Response) => {
  try {
    const { title, author, isbn, category, totalCopies } = req.body;
    const copies = Number(totalCopies) || 1;
    const book = await prisma.book.create({
      data: { title, author, isbn, category, totalCopies: copies, availableCopies: copies },
    });
    await logAudit("CREATE", "books", book.id, req.user!.id, null, book, req.ip, req.get("user-agent"));
    return successResponse(res, book, "Book added", 201);
  } catch (error) { throw error; }
};

export const updateBook = async (req: Request, res: Response) => {
  try {
    const book = await prisma.book.update({ where: { id: req.params.id }, data: req.body });
    return successResponse(res, book, "Book updated");
  } catch (error) { throw error; }
};

export const deleteBook = async (req: Request, res: Response) => {
  try {
    await prisma.book.delete({ where: { id: req.params.id } });
    return successResponse(res, null, "Book removed");
  } catch (error) { throw error; }
};

export const getLoans = async (req: Request, res: Response) => {
  try {
    const { status, studentId } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (studentId) where.studentId = studentId;
    const loans = await prisma.bookLoan.findMany({
      where,
      include: { book: true, student: true },
      orderBy: { borrowedAt: "desc" },
    });
    return successResponse(res, loans);
  } catch (error) { throw error; }
};

export const borrowBook = async (req: Request, res: Response) => {
  try {
    const { bookId, studentId, dueDate } = req.body;
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) return errorResponse(res, "Book not found", 404);
    if (book.availableCopies < 1) return errorResponse(res, "No copies available to borrow.", 422);

    const [loan] = await prisma.$transaction([
      prisma.bookLoan.create({
        data: { bookId, studentId, dueDate: new Date(dueDate), status: "BORROWED" },
        include: { book: true, student: true },
      }),
      prisma.book.update({ where: { id: bookId }, data: { availableCopies: { decrement: 1 } } }),
    ]);

    await logAudit("CREATE", "book_loans", loan.id, req.user!.id, null, loan, req.ip, req.get("user-agent"));
    return successResponse(res, loan, "Book issued", 201);
  } catch (error) { throw error; }
};

export const returnBook = async (req: Request, res: Response) => {
  try {
    const loan = await prisma.bookLoan.findUnique({ where: { id: req.params.id } });
    if (!loan) return errorResponse(res, "Loan not found", 404);
    if (loan.status === "RETURNED") return errorResponse(res, "This book was already returned.", 422);

    const [updated] = await prisma.$transaction([
      prisma.bookLoan.update({
        where: { id: req.params.id },
        data: { status: "RETURNED", returnedAt: new Date() },
        include: { book: true, student: true },
      }),
      prisma.book.update({ where: { id: loan.bookId }, data: { availableCopies: { increment: 1 } } }),
    ]);

    return successResponse(res, updated, "Book returned");
  } catch (error) { throw error; }
};
