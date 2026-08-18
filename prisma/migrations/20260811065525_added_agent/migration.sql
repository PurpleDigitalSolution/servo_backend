-- CreateEnum
CREATE TYPE "workStatus" AS ENUM ('AVAILABLE', 'NOT_AVAILABLE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "stationId" TEXT,
ADD COLUMN     "workStatus" "workStatus" DEFAULT 'AVAILABLE';

-- CreateIndex
CREATE INDEX "User_stationId_role_workStatus_idx" ON "User"("stationId", "role", "workStatus");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE SET NULL ON UPDATE CASCADE;
