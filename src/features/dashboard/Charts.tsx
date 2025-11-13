"use client";

import React from "react";

type ExpenseCat = { name: string; amount: number; color: string };
type Props = {
  monthlyData: { income: number; expenses: number };
  expenseCategories: ExpenseCat[];
};

export default function Charts({ monthlyData, expenseCategories }: Props) {
  const maxValue = Math.max(
    monthlyData.income,
    monthlyData.expenses,
    1 // prevent divide-by-zero
  );
  const incomeWidth = (monthlyData.income / maxValue) * 100;
  const expenseWidth = (monthlyData.expenses / maxValue) * 100;
  const isExpenseHigher = monthlyData.expenses > monthlyData.income;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Income vs Expenses
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Income</span>
              <span className="text-sm font-bold text-green-600">
                AED {monthlyData.income}
              </span>
            </div>
            <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                style={{ width: `${incomeWidth}%` }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                Expenses
              </span>
              <span className="text-sm font-bold text-red-600">
                AED {monthlyData.expenses}
              </span>
            </div>
            <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-pink-500"
                style={{
                  width: `${expenseWidth}%`,
                }}
              ></div>
            </div>
            {isExpenseHigher && (
              <p className="text-xs text-red-500 mt-2">
                Expenses exceed income this period.
              </p>
            )}
          </div>
        </div>
      </div>

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
                      width: `${(cat.amount / monthlyData.expenses) * 100}%`,
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
  );
}
