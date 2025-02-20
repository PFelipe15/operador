-- CreateTable
CREATE TABLE "botWhatsapp" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "qrcode" TEXT NOT NULL,
    "hasConnected" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "botWhatsapp_pkey" PRIMARY KEY ("id")
);
