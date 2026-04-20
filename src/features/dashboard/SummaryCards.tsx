"use client";

import { ArrowDownRight, ArrowUpRight, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { cardHover } from "@/lib/motion";

type MonthlyData = { income: number; expenses: number; netSavings: number };

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function SummaryCards({ monthlyData }: { monthlyData: MonthlyData }) {
  const cards = [
    {
      label: "Total Income",
      value: monthlyData.income,
      icon: ArrowDownRight,
      iconBg: "bg-success-muted",
      iconColor: "text-success",
      valueColor: "text-success",
    },
    {
      label: "Total Expenses",
      value: monthlyData.expenses,
      icon: ArrowUpRight,
      iconBg: "bg-danger-muted",
      iconColor: "text-danger",
      valueColor: "text-danger",
    },
    {
      label: "Net Savings",
      value: monthlyData.netSavings,
      icon: TrendingUp,
      iconBg: monthlyData.netSavings >= 0 ? "bg-accent-muted" : "bg-danger-muted",
      iconColor: monthlyData.netSavings >= 0 ? "text-accent" : "text-danger",
      valueColor: monthlyData.netSavings >= 0 ? "text-text-primary" : "text-danger",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {cards.map(({ label, value, icon: Icon, iconBg, iconColor, valueColor }) => (
        <motion.div
          key={label}
          initial="rest"
          whileHover="hover"
          whileTap="tap"
          variants={cardHover}
          className="bg-surface border border-border rounded-2xl p-4 sm:p-5 transition-all duration-200 hover:border-border-bright hover:bg-elevated"
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
              <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
            <span className="text-[10px] font-semibold font-mono text-text-muted uppercase tracking-widest">
              {label}
            </span>
          </div>
          <p className={`font-display text-2xl font-bold ${valueColor} tabular-nums tracking-tight`}>
            AED {fmt(value)}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
