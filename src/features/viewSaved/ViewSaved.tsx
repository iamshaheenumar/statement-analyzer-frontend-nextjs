import prisma from "@/services/prisma";
import SavedHeader from "./components/SavedHeader";
import TransactionsTable from "../viewParsed/components/TransactionsTable";

type Props = {
  id: string;
};

// Fetch statement + related transactions directly from DB
async function getStatement(id: string) {
  const statement = await prisma.statement.findUnique({
    where: { id },
  });

  if (!statement) {
    throw new Error("Statement not found");
  }

  const transactions = await prisma.transaction.findMany({
    where: { statementId: id },
    orderBy: { transactionDate: "asc" },
  });

  return {
    id: statement.id,
    bank: statement.bank,
    created_at: statement.createdAt,
    card_type: statement.card_type,
    from_date: statement.from_date,
    to_date: statement.to_date,
    summary: {
      record_count: statement.recordCount,
      total_debit: Number(statement.totalDebit),
      total_credit: Number(statement.totalCredit),
      net_change: Number(statement.netChange),
    },
    transactions: transactions.map((t) => ({
      id: t.id,
      transaction_date: t.transactionDate,
      description: t.description,
      debit: Number(t.debit) ?? null,
      credit: Number(t.credit) ?? null,
      amount: Number(t.amount) ?? null,
      bank: t.bank,
    })),
  };
}

export default async function ViewSaved({ id }: Props) {
  const statement = await getStatement(id);

  return (
    <div className="space-y-6">
      <SavedHeader statement={statement} />
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <TransactionsTable transactions={statement.transactions} />
      </div>
    </div>
  );
}
