-- CreateTable
CREATE TABLE "PriceSettings" (
    "id" TEXT NOT NULL,
    "deliveryFeeId" TEXT NOT NULL,
    "vatId" TEXT NOT NULL,

    CONSTRAINT "PriceSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceSettingsValue" (
    "id" TEXT NOT NULL,
    "isEnable" BOOLEAN NOT NULL DEFAULT true,
    "value" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "PriceSettingsValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PriceSettings_deliveryFeeId_key" ON "PriceSettings"("deliveryFeeId");

-- CreateIndex
CREATE UNIQUE INDEX "PriceSettings_vatId_key" ON "PriceSettings"("vatId");

-- AddForeignKey
ALTER TABLE "PriceSettings" ADD CONSTRAINT "PriceSettings_deliveryFeeId_fkey" FOREIGN KEY ("deliveryFeeId") REFERENCES "PriceSettingsValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceSettings" ADD CONSTRAINT "PriceSettings_vatId_fkey" FOREIGN KEY ("vatId") REFERENCES "PriceSettingsValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
