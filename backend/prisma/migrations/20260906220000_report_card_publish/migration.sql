-- AlterTable
ALTER TABLE "report_cards" ADD COLUMN "isPublished" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "report_cards" ADD COLUMN "publishedAt" TIMESTAMP(3);
ALTER TABLE "report_cards" ADD COLUMN "publishedBy" TEXT;
