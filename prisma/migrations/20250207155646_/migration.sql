/*
  Warnings:

  - The values [CREDIT_ANALYSIS,DOCUMENTATION,REGISTRATION,LEGAL] on the enum `ProcessType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProcessType_new" AS ENUM ('ABERTURA_MEI', 'ALTERACAO_MEI', 'BAIXA_MEI');
ALTER TABLE "Process" ALTER COLUMN "type" TYPE "ProcessType_new" USING ("type"::text::"ProcessType_new");
ALTER TYPE "ProcessType" RENAME TO "ProcessType_old";
ALTER TYPE "ProcessType_new" RENAME TO "ProcessType";
DROP TYPE "ProcessType_old";
COMMIT;
