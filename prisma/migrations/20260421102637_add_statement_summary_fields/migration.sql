-- AlterTable
ALTER TABLE "Statement" ADD COLUMN     "available_credit" DECIMAL(65,30),
ADD COLUMN     "card_variant" TEXT,
ADD COLUMN     "credit_limit" DECIMAL(65,30),
ADD COLUMN     "issued_date" TIMESTAMP(3),
ADD COLUMN     "min_payment_due" DECIMAL(65,30),
ADD COLUMN     "total_amount_due" DECIMAL(65,30),
ADD COLUMN     "total_outstanding" DECIMAL(65,30);
