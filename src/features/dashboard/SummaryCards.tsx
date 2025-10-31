"use client";

import React from "react";
import { ArrowDownRight, ArrowUpRight, TrendingUp } from "lucide-react";

type MonthlyData = { income: number; expenses: number; netSavings: number };

export default function SummaryCards({
  monthlyData,
}: {
  monthlyData: MonthlyData;
}) {
  return (
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
          AED {monthlyData.income.toLocaleString()}
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
          AED {monthlyData.expenses.toLocaleString()}
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
          AED {monthlyData.netSavings.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
