import prisma from "@/services/prisma";
import { getUser } from "@/lib/supabase/server";
import SavedHeader from "./components/SavedHeader";
import TransactionsTable from "./components/TransactionsTable";
import { AlertCircle } from "lucide-react";

type Props = { id: string };

async function getStatement(id: string, userId: string) {
  const statement = await prisma.statement.findFirst({
    where: { id, userId },
  });

  if (!statement) return null;

  const transactions = await prisma.transaction.findMany({
    where: { statementId: id },
    include: { category: true },
    orderBy: { transactionDate: "asc" },
  });

  return {
    id: statement.id,
    bank: statement.bank,
    created_at: statement.createdAt,
    card_type: statement.card_type,
    card_variant: statement.card_variant,
    from_date: statement.from_date,
    to_date: statement.to_date,
    issued_date: statement.issued_date,
    currency: statement.currency,
    credit_limit: statement.credit_limit ? Number(statement.credit_limit) : null,
    available_credit: statement.available_credit ? Number(statement.available_credit) : null,
    min_payment_due: statement.min_payment_due ? Number(statement.min_payment_due) : null,
    total_outstanding: statement.total_outstanding ? Number(statement.total_outstanding) : null,
    total_amount_due: statement.total_amount_due ? Number(statement.total_amount_due) : null,
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
      debit: t.debit ? Number(t.debit) : null,
      credit: t.credit ? Number(t.credit) : null,
      amount: t.amount ? Number(t.amount) : null,
      bank: t.bank,
      categoryId: t.categoryId,
      category: t.category
        ? { id: t.category.id, name: t.category.name, color: t.category.color }
        : null,
    })),
  };
}

export default async function ViewSaved({ id }: Props) {
  const user = await getUser();

  const [statement, allCategories] = await Promise.all([
    getStatement(id, user!.id),
    prisma.category.findMany({
      where: { OR: [{ userId: null }, { userId: user!.id }] },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    }),
  ]);

  if (!statement) {
    return (
      <div className="flex items-start gap-2.5 p-4 bg-danger-muted border border-danger/20 rounded-xl">
        <AlertCircle className="w-4 h-4 text-danger mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-danger">Statement not found</p>
          <p className="text-xs text-danger/80 mt-0.5">
            This statement doesn&apos;t exist or belongs to another account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <SavedHeader statement={statement} />
      <TransactionsTable
        transactions={statement.transactions}
        allCategories={allCategories.map((c) => ({
          id: c.id,
          name: c.name,
          color: c.color,
        }))}
        currency={statement.currency}
      />
    </div>
  );
}
