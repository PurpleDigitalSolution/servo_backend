-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'PAYMENT_FAILED';

-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'FLUTTERWAVE';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "failureReason" TEXT;
