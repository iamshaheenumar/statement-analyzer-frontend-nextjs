-- CreateTable
CREATE TABLE "Statement" (
    "id" TEXT NOT NULL,
    "bank" TEXT NOT NULL,
    "recordCount" INTEGER NOT NULL,
    "totalDebit" DECIMAL(65,30) NOT NULL,
    "totalCredit" DECIMAL(65,30) NOT NULL,
    "netChange" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Statement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "statementId" TEXT NOT NULL,
    "transactionDate" TIMESTAMP(3),
    "description" TEXT,
    "debit" DECIMAL(65,30),
    "credit" DECIMAL(65,30),
    "amount" DECIMAL(65,30),
    "bank" TEXT,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_statementId_fkey" FOREIGN KEY ("statementId") REFERENCES "Statement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
