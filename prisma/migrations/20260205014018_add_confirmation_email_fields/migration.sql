-- DropIndex
DROP INDEX "Order_createdAt_idx";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "confirmationEmailId" TEXT,
ADD COLUMN     "confirmationEmailSentAt" TIMESTAMP(3);
