-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "uploadedById" TEXT;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "Operator"("id") ON DELETE SET NULL ON UPDATE CASCADE;
