/*
  Warnings:

  - You are about to drop the `botWhatsapp` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "botWhatsapp";

-- CreateTable
CREATE TABLE "bot_whatsapp" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "name" TEXT NOT NULL DEFAULT 'Bot WhatsApp',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "qrcode" TEXT NOT NULL,
    "hasConnected" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "bot_whatsapp_pkey" PRIMARY KEY ("id")
);
