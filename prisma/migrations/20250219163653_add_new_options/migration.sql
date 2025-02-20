-- AlterTable
ALTER TABLE "bot_whatsapp" ADD COLUMN     "batteryLevel" INTEGER,
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "isOnline" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastConnection" TIMESTAMP(3),
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'DISCONNECTED',
ALTER COLUMN "qrcode" DROP NOT NULL;
