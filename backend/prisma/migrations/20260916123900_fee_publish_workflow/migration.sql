-- Add publish workflow fields to fees: admin-assigned fees start unpublished;
-- only visible to parents/students once admin publishes the batch.
ALTER TABLE "fees" ADD COLUMN "isPublished" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "fees" ADD COLUMN "publishedAt" TIMESTAMP(3);
ALTER TABLE "fees" ADD COLUMN "publishedBy" TEXT;
