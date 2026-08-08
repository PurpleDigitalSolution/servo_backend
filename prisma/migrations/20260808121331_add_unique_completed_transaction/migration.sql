-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'SUSPEND', 'ASSIGN', 'APPROVE', 'CANCEL', 'VERIFY', 'REFUND');

-- CreateEnum
CREATE TYPE "resourceType" AS ENUM ('USER', 'ROLE', 'STATION', 'ORDER', 'PAYMENT', 'DASHBOARD', 'SETTINGS', 'TRANSACTION');

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "resourceType" "resourceType",
    "resourceId" VARCHAR(100),
    "status" VARCHAR(20) NOT NULL,
    "errorMessage" TEXT,
    "ipAddress" INET,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "unique_completed_transaction_per_order"
ON "Transaction" ("orderId")
WHERE "status" = 'COMPLETED';

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
