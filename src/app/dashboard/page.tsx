import { Suspense } from "react";
import prisma from "@/services/prisma";
import Header from "@/features/dashboard/Header";
import SummaryCards from "@/features/dashboard/SummaryCards";
import Charts from "@/features/dashboard/Charts";
import TransactionsTable from "@/features/dashboard/TransactionsTable";

// Mock Data
const monthlyData = {
  income: 12500,
  expenses: 8750,
  netSavings: 3750,
};

const expenseCategories = [
  { name: "Food & Dining", amount: 2100, color: "#3B82F6" },
  { name: "Shopping", amount: 1800, color: "#8B5CF6" },
  { name: "Transportation", amount: 950, color: "#10B981" },
  { name: "Entertainment", amount: 750, color: "#F59E0B" },
  { name: "Bills & Utilities", amount: 1200, color: "#EF4444" },
  { name: "Healthcare", amount: 450, color: "#EC4899" },
  { name: "Others", amount: 1500, color: "#6B7280" },
];

const savingsGoals = [
  { name: "Emergency Fund", current: 8500, target: 15000, color: "#3B82F6" },
  { name: "Vacation", current: 2300, target: 5000, color: "#10B981" },
  { name: "New Car", current: 12000, target: 25000, color: "#8B5CF6" },
];

const topMerchants = [
  { name: "Amazon", amount: 1250, transactions: 8 },
  { name: "Starbucks", amount: 380, transactions: 15 },
  { name: "Uber", amount: 320, transactions: 12 },
  { name: "Netflix", amount: 15, transactions: 1 },
  { name: "Walmart", amount: 890, transactions: 6 },
];

const recurringPayments = [
  {
    name: "Netflix Subscription",
    amount: 15,
    nextDate: "2025-11-01",
    category: "Entertainment",
  },
  {
    name: "Gym Membership",
    amount: 50,
    nextDate: "2025-11-05",
    category: "Health",
  },
  {
    name: "Spotify Premium",
    amount: 10,
    nextDate: "2025-11-10",
    category: "Entertainment",
  },
  {
    name: "Internet Bill",
    amount: 80,
    nextDate: "2025-11-15",
    category: "Bills",
  },
];

const transactions = [
  {
    date: "2025-10-23",
    description: "Grocery Store",
    category: "Food",
    amount: -125.5,
    type: "Debit",
  },
  {
    date: "2025-10-22",
    description: "Salary Deposit",
    category: "Income",
    amount: 5000,
    type: "Credit",
  },
  {
    date: "2025-10-21",
    description: "Amazon Purchase",
    category: "Shopping",
    amount: -89.99,
    type: "Credit Card",
  },
  {
    date: "2025-10-20",
    description: "Uber Ride",
    category: "Transportation",
    amount: -25.0,
    type: "Debit",
  },
  {
    date: "2025-10-19",
    description: "Restaurant",
    category: "Food",
    amount: -65.0,
    type: "Credit Card",
  },
];

const expenseCategoryColors = {
  Food: "#3B82F6",
  Shopping: "#8B5CF6",
  Transportation: "#10B981",
  Entertainment: "#F59E0B",
  Bills: "#EF4444",
  Healthcare: "#EC4899",
  Others: "#6B7280",
} as const;

async function getData(month?: string, year?: string) {
  const currentDate = new Date();
  const selectedYear = year ? parseInt(year) : currentDate.getFullYear();
  const selectedMonth = month ? parseInt(month) : currentDate.getMonth() + 1;

  const startDate = new Date(selectedYear, selectedMonth - 1, 1);
  const endDate = new Date(selectedYear, selectedMonth, 0);

  const transactions = await prisma.transaction.findMany({
    where: {
      transactionDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      transactionDate: "desc",
    },
  });

  const monthlyData = transactions.reduce(
    (acc, tx) => {
      const amount = tx.amount ? Number(tx.amount) : 0;
      if (amount > 0) {
        acc.income += amount;
      } else {
        acc.expenses += Math.abs(amount);
      }
      return acc;
    },
    { income: 0, expenses: 0, netSavings: 0 }
  );
  monthlyData.netSavings = monthlyData.income - monthlyData.expenses;

  const expenseCategories = Array.from(
    transactions
      .filter((tx) => tx.amount && Number(tx.amount) < 0)
      .reduce((acc, tx) => {
        const category = tx.description?.split(" ")[0] || "Others";
        const amount = Math.abs(Number(tx.amount || 0));
        acc.set(category, (acc.get(category) || 0) + amount);
        return acc;
      }, new Map<string, number>())
  ).map(([name, amount]) => ({
    name,
    amount,
    color:
      (expenseCategoryColors as Record<string, string>)[name] ||
      expenseCategoryColors.Others,
  }));

  return {
    monthlyData,
    expenseCategories,
    transactions: transactions.map((tx) => ({
      date: tx.transactionDate?.toISOString().split("T")[0] || "",
      description: tx.description || "",
      category: tx.description?.split(" ")[0] || "Others",
      amount: tx.amount ? Number(tx.amount) : 0,
      type: tx.amount && Number(tx.amount) > 0 ? "Credit" : "Debit",
    })),
  };
}

export default async function FinanceDashboard({
  searchParams,
}: {
  searchParams?: { month?: string; year?: string };
}) {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // Await searchParams before destructuring
  const params = await Promise.resolve(searchParams);
  const month = params?.month;
  const year = params?.year;

  const { monthlyData, expenseCategories, transactions } = await getData(
    month || currentMonth.toString(),
    year || currentYear.toString()
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Header />

        <SummaryCards monthlyData={monthlyData} />

        <Charts
          monthlyData={monthlyData}
          expenseCategories={expenseCategories}
        />

        <TransactionsTable transactions={transactions} />
      </div>
    </div>
  );
}
