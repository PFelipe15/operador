-- CreateEnum
CREATE TYPE "NotePriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "NoteType" AS ENUM ('PRIVATE', 'INTERNAL', 'PUBLIC');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('DEADLINE', 'FOLLOWUP', 'MEETING', 'DOCUMENT');

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'text',
    "fromMe" BOOLEAN NOT NULL DEFAULT false,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "whatsappMessageId" TEXT,
    "remoteJid" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "processId" TEXT,
    "operatorId" TEXT,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,
    "type" "NoteType" NOT NULL DEFAULT 'PRIVATE',
    "priority" "NotePriority" NOT NULL DEFAULT 'MEDIUM',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "processId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "processId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "assignedTo" TEXT,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "ReminderType" NOT NULL DEFAULT 'DEADLINE',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "notifiedAt" TIMESTAMP(3),
    "processId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Message_remoteJid_idx" ON "Message"("remoteJid");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE INDEX "Message_processId_idx" ON "Message"("processId");

-- CreateIndex
CREATE INDEX "Message_whatsappMessageId_idx" ON "Message"("whatsappMessageId");

-- CreateIndex
CREATE INDEX "Note_processId_idx" ON "Note"("processId");

-- CreateIndex
CREATE INDEX "Note_createdBy_idx" ON "Note"("createdBy");

-- CreateIndex
CREATE INDEX "Note_createdAt_idx" ON "Note"("createdAt");

-- CreateIndex
CREATE INDEX "Task_processId_idx" ON "Task"("processId");

-- CreateIndex
CREATE INDEX "Task_createdBy_idx" ON "Task"("createdBy");

-- CreateIndex
CREATE INDEX "Task_assignedTo_idx" ON "Task"("assignedTo");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");

-- CreateIndex
CREATE INDEX "Reminder_processId_idx" ON "Reminder"("processId");

-- CreateIndex
CREATE INDEX "Reminder_createdBy_idx" ON "Reminder"("createdBy");

-- CreateIndex
CREATE INDEX "Reminder_dueDate_idx" ON "Reminder"("dueDate");

-- CreateIndex
CREATE INDEX "Reminder_completed_idx" ON "Reminder"("completed");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Operator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Operator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "Operator"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "Operator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
