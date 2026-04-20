import { Suspense } from "react";
import prisma from "@/services/prisma";
import { getUser } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import Header from "@/features/dashboard/Header";
import SummaryCards from "@/features/dashboard/SummaryCards";
import Charts from "@/features/dashboard/Charts";
import TransactionsTable from "@/features/dashboard/TransactionsTable";

const expenseCategoryColors = {
  Food: "#3B82F6",
  Shopping: "#8B5CF6",
  Transportation: "#10B981",
  Entertainment: "#F59E0B",
  Bills: "#EF4444",
  Healthcare: "#EC4899",
  Others: "#6B7280",
} as const;

type AvailableMonth = { month: string; year: string };
type TransactionType = "Credit" | "Debit" | "Neutral";

export type DashboardTransaction = {
  date: string;
  description: string;
  category: string;
  amount: number;
  type: TransactionType;
};

async function getData(userId: string, month?: string, year?: string) {
  const currentDate = new Date();
  const selectedYear = year ? parseInt(year) : currentDate.getFullYear();
  const selectedMonth = month ? parseInt(month) : currentDate.getMonth() + 1;

  const startDate = new Date(selectedYear, selectedMonth - 1, 1);
  const endDate = new Date(selectedYear, selectedMonth, 0);

  const availableMonthRecords = await prisma.transaction.findMany({
    where: {
      transactionDate: { not: null },
      statement: { userId },
    },
    select: { transactionDate: true },
    orderBy: { transactionDate: "desc" },
    distinct: ["transactionDate"],
  });

  const monthYearSeen = new Set<string>();
  const availableMonths = availableMonthRecords.reduce<AvailableMonth[]>((acc, record) => {
    if (!record.transactionDate) return acc;
    const m = (record.transactionDate.getMonth() + 1).toString();
    const y = record.transactionDate.getFullYear().toString();
    const key = `${m}-${y}`;
    if (monthYearSeen.has(key)) return acc;
    monthYearSeen.add(key);
    acc.push({ month: m, year: y });
    return acc;
  }, []);

  const transactions = await prisma.transaction.findMany({
    where: {
      transactionDate: { gte: startDate, lte: endDate },
      statement: { userId },
    },
    orderBy: { transactionDate: "desc" },
  });

  const monthlyData = transactions.reduce(
    (acc, tx) => {
      const credit = tx.credit ? Number(tx.credit) : 0;
      const debit = tx.debit ? Number(tx.debit) : 0;
      if (credit > 0) acc.income += credit;
      if (debit > 0) acc.expenses += debit;
      return acc;
    },
    { income: 0, expenses: 0, netSavings: 0 }
  );
  monthlyData.netSavings = monthlyData.income - monthlyData.expenses;

  const expenseCategories = Array.from(
    transactions
      .filter((tx) => tx.debit && Number(tx.debit) > 0)
      .reduce((acc, tx) => {
        const category = tx.description?.split(" ")[0] || "Others";
        const amount = Number(tx.debit || 0);
        acc.set(category, (acc.get(category) || 0) + amount);
        return acc;
      }, new Map<string, number>())
  ).map(([name, amount]) => ({
    name,
    amount,
    color: (expenseCategoryColors as Record<string, string>)[name] || expenseCategoryColors.Others,
  }));

  const formattedTransactions: DashboardTransaction[] = transactions.map((tx) => ({
    date: tx.transactionDate?.toISOString().split("T")[0] || "",
    description: tx.description || "",
    category: tx.description?.split(" ")[0] || "Others",
    amount:
      tx.credit && Number(tx.credit) > 0
        ? Number(tx.credit)
        : tx.debit && Number(tx.debit) > 0
        ? -Number(tx.debit)
        : 0,
    type:
      tx.credit && Number(tx.credit) > 0
        ? "Credit"
        : tx.debit && Number(tx.debit) > 0
        ? "Debit"
        : "Neutral",
  }));

  return { monthlyData, expenseCategories, transactions: formattedTransactions, availableMonths };
}

export default async function FinanceDashboard({
  searchParams,
}: {
  searchParams?: Promise<{ month?: string; year?: string }>;
}) {
  const user = await getUser();
  const currentDate = new Date();
  const params = await searchParams;

  const { monthlyData, expenseCategories, transactions, availableMonths } = await getData(
    user!.id,
    params?.month || (currentDate.getMonth() + 1).toString(),
    params?.year || currentDate.getFullYear().toString()
  );

  return (
    <div className="min-h-screen bg-base">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-5">
        <Suspense>
          <Header availableMonths={availableMonths} />
        </Suspense>
        <SummaryCards monthlyData={monthlyData} />
        <Charts monthlyData={monthlyData} expenseCategories={expenseCategories} />
        <TransactionsTable transactions={transactions} />
      </main>
    </div>
  );
}
