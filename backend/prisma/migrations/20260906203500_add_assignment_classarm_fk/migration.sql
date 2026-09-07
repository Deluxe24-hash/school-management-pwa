-- AddForeignKey (this was missing from the original migration)
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_classArmId_fkey" FOREIGN KEY ("classArmId") REFERENCES "class_arms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
