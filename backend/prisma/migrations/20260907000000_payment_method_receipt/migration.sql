-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PAYSTACK', 'BANK_TRANSFER', 'CASH_DEPOSIT');

-- AlterTable
ALTER TABLE "payments" ADD COLUMN "method" "PaymentMethod" NOT NULL DEFAULT 'PAYSTACK';
ALTER TABLE "payments" ADD COLUMN "receiptData" TEXT;
ALTER TABLE "payments" ADD COLUMN "submittedNote" TEXT;
