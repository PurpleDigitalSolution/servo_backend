/*
  Warnings:

  - Added the required column `VAT` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deliveryFee` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "VAT" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "deliveryFee" DECIMAL(10,2) NOT NULL;
