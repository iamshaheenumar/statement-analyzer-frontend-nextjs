import prisma from "@/services/prisma";
import { getUser } from "@/lib/supabase/server";
import SavedHeader from "./components/SavedHeader";
import TransactionsTable from "../viewParsed/components/TransactionsTable";
import { AlertCircle } from "lucide-react";

type Props = { id: string };

async function getStatement(id: string, userId: string) {
  const statement = await prisma.statement.findFirst({
    where: { id, userId },
  });

  if (!statement) return null;

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
  const user = await getUser();
  const statement = await getStatement(id, user!.id);

  if (!statement) {
    return (
      <div className="flex items-start gap-2.5 p-4 bg-red-50 border border-red-200 rounded-xl">
        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-red-700">Statement not found</p>
          <p className="text-xs text-red-600 mt-0.5">
            This statement doesn&apos;t exist or belongs to another account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SavedHeader statement={statement} />
      <TransactionsTable transactions={statement.transactions} />
    </div>
  );
}
