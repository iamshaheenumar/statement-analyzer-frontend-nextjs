"use client";

import { ArrowDownRight, ArrowUpRight, TrendingUp } from "lucide-react";

type MonthlyData = { income: number; expenses: number; netSavings: number };

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function SummaryCards({ monthlyData }: { monthlyData: MonthlyData }) {
  const cards = [
    {
      label: "Total Income",
      value: monthlyData.income,
      icon: ArrowDownRight,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      valueColor: "text-green-700",
    },
    {
      label: "Total Expenses",
      value: monthlyData.expenses,
      icon: ArrowUpRight,
      iconBg: "bg-red-100",
      iconColor: "text-red-500",
      valueColor: "text-red-600",
    },
    {
      label: "Net Savings",
      value: monthlyData.netSavings,
      icon: TrendingUp,
      iconBg: monthlyData.netSavings >= 0 ? "bg-blue-100" : "bg-orange-100",
      iconColor: monthlyData.netSavings >= 0 ? "text-blue-600" : "text-orange-600",
      valueColor: monthlyData.netSavings >= 0 ? "text-blue-700" : "text-red-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {cards.map(({ label, value, icon: Icon, iconBg, iconColor, valueColor }) => (
        <div
          key={label}
          className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
              <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              {label}
            </span>
          </div>
          <p className={`text-2xl font-bold ${valueColor} tabular-nums`}>
            AED {fmt(value)}
          </p>
        </div>
      ))}
    </div>
  );
}
