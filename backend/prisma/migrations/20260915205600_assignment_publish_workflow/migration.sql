-- Add publish workflow fields to assignments: teacher-created assignments start
-- unpublished (pending admin review); admin can edit/delete/publish/unpublish.
ALTER TABLE "assignments" ADD COLUMN "isPublished" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "assignments" ADD COLUMN "publishedAt" TIMESTAMP(3);
ALTER TABLE "assignments" ADD COLUMN "publishedBy" TEXT;
