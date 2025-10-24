"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  Calendar,
  Search,
  ChevronDown,
  Target,
  RefreshCw,
  Store,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
} from "lucide-react";

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

export default function FinanceDashboard() {
  const [selectedMonth, setSelectedMonth] = useState("October 2025");
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                <Wallet className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900">
                  Finance Dashboard
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Track your spending and savings
                </p>
              </div>
            </div>

            {/* Month Selector */}
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="appearance-none px-5 py-3 pr-10 bg-white border-2 border-gray-200 rounded-2xl font-semibold text-gray-700 cursor-pointer hover:border-blue-400 focus:border-blue-500 focus:outline-none transition-all"
              >
                <option>October 2025</option>
                <option>September 2025</option>
                <option>August 2025</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                <ArrowDownRight className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                +12%
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Total Income
            </p>
            <p className="text-3xl font-bold text-gray-900">
              ${monthlyData.income.toLocaleString()}
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-lg">
                <ArrowUpRight className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full">
                +8%
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Total Expenses
            </p>
            <p className="text-3xl font-bold text-gray-900">
              ${monthlyData.expenses.toLocaleString()}
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                +23%
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Net Savings
            </p>
            <p className="text-3xl font-bold text-gray-900">
              ${monthlyData.netSavings.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income vs Expenses Bar Chart */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Income vs Expenses
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    Income
                  </span>
                  <span className="text-sm font-bold text-green-600">
                    ${monthlyData.income}
                  </span>
                </div>
                <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                    style={{ width: "100%" }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    Expenses
                  </span>
                  <span className="text-sm font-bold text-red-600">
                    ${monthlyData.expenses}
                  </span>
                </div>
                <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-pink-500"
                    style={{
                      width: `${
                        (monthlyData.expenses / monthlyData.income) * 100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Expense Categories Pie Chart */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Expense Categories
            </h3>
            <div className="space-y-3">
              {expenseCategories.slice(0, 5).map((cat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  ></div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {cat.name}
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        ${cat.amount}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${
                            (cat.amount / monthlyData.expenses) * 100
                          }%`,
                          backgroundColor: cat.color,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Credit Card Tracker & Savings Goals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Credit Card Tracker */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Credit Card</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Total Due</p>
                  <p className="text-2xl font-bold text-gray-900">$2,450</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Minimum Due</p>
                  <p className="text-2xl font-bold text-orange-600">$125</p>
                </div>
              </div>
              <div className="bg-gray-100 rounded-xl p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Due Date</span>
                  <span className="text-sm font-bold text-gray-900">
                    Nov 15, 2025
                  </span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    style={{ width: "60%" }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  60% of credit limit used
                </p>
              </div>
            </div>
          </div>

          {/* Savings Goals */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center shadow-lg">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Savings Goals</h3>
            </div>
            <div className="space-y-4">
              {savingsGoals.map((goal, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {goal.name}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      ${goal.current.toLocaleString()} / $
                      {goal.target.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${(goal.current / goal.target) * 100}%`,
                        background: `linear-gradient(to right, ${goal.color}, ${goal.color})`,
                      }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {Math.round((goal.current / goal.target) * 100)}% complete
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Merchants & Recurring Payments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Merchants */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
                <Store className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Top Merchants</h3>
            </div>
            <div className="space-y-3">
              {topMerchants.map((merchant, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-orange-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-bold text-sm text-gray-700">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {merchant.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {merchant.transactions} transactions
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-gray-900">${merchant.amount}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recurring Payments */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                <RefreshCw className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Recurring Payments
              </h3>
            </div>
            <div className="space-y-3">
              {recurringPayments.map((payment, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-indigo-50 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {payment.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <p className="text-xs text-gray-500">
                        Next: {payment.nextDate}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">${payment.amount}</p>
                    <p className="text-xs text-gray-500">{payment.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Recent Transactions
              </h3>
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl text-sm focus:border-blue-400 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((txn, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {txn.date}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                      {txn.description}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                        {txn.category}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {txn.type}
                    </td>
                    <td
                      className={`px-4 py-4 text-sm font-bold text-right ${
                        txn.amount > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {txn.amount > 0 ? "+" : ""}
                      {txn.amount < 0 ? "-" : ""}$
                      {Math.abs(txn.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

