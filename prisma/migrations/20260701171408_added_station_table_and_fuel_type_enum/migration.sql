-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('PETROL', 'DIESEL', 'COOKING_GAS');

-- CreateTable
CREATE TABLE "Station" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "addressState" TEXT NOT NULL,
    "addressStreet" TEXT NOT NULL,
    "addressCity" TEXT NOT NULL,
    "addressCountry" TEXT NOT NULL DEFAULT 'Nigeria',
    "isAvailable" BOOLEAN NOT NULL DEFAULT false,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "openTime" TIME,
    "closeTime" TIME,
    "is24h" BOOLEAN NOT NULL DEFAULT false,
    "fuelTypes" "FuelType"[],
    "prices" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Station_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Station_addressCity_idx" ON "Station"("addressCity");

-- CreateIndex
CREATE INDEX "Station_isAvailable_idx" ON "Station"("isAvailable");

-- CreateIndex
CREATE UNIQUE INDEX "Station_name_addressStreet_addressCity_key" ON "Station"("name", "addressStreet", "addressCity");
