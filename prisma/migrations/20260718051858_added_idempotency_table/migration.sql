-- CreateEnum
CREATE TYPE "IdempotencyStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "IdempotencyRequest" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "userId" TEXT,
    "status" "IdempotencyStatus" NOT NULL DEFAULT 'PENDING',
    "requestHash" TEXT,
    "response" JSONB,
    "error" JSONB,
    "lockedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdempotencyRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IdempotencyRequest_userId_idx" ON "IdempotencyRequest"("userId");

-- CreateIndex
CREATE INDEX "IdempotencyRequest_expiresAt_idx" ON "IdempotencyRequest"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyRequest_key_route_key" ON "IdempotencyRequest"("key", "route");
