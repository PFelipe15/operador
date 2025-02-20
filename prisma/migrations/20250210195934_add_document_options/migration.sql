-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "rejectionById" TEXT,
ADD COLUMN     "verifiedById" TEXT;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "Operator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_rejectionById_fkey" FOREIGN KEY ("rejectionById") REFERENCES "Operator"("id") ON DELETE SET NULL ON UPDATE CASCADE;
