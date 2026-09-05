-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('BORROWED', 'RETURNED', 'OVERDUE');
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "books" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "author" TEXT NOT NULL,
  "isbn" TEXT,
  "category" TEXT,
  "totalCopies" INTEGER NOT NULL DEFAULT 1,
  "availableCopies" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "book_loans" (
  "id" TEXT NOT NULL,
  "bookId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "borrowedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "returnedAt" TIMESTAMP(3),
  "status" "LoanStatus" NOT NULL DEFAULT 'BORROWED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "book_loans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "applications" (
  "id" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "middleName" TEXT,
  "gender" "Gender" NOT NULL,
  "dateOfBirth" TIMESTAMP(3),
  "classAppliedFor" TEXT NOT NULL,
  "previousSchool" TEXT,
  "parentName" TEXT NOT NULL,
  "parentPhone" TEXT NOT NULL,
  "parentEmail" TEXT,
  "address" TEXT,
  "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "reviewedBy" TEXT,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "book_loans" ADD CONSTRAINT "book_loans_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "book_loans" ADD CONSTRAINT "book_loans_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
