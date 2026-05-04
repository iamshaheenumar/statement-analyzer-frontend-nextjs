"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, PieChart } from "lucide-react";

type Transaction = {
  debit: number | null;
  credit: number | null;
  category: { id: string; name: string; color: string } | null;
};

type Props = {
  transactions: Transaction[];
  currency?: string;
};

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ExpenseBreakdown({ transactions, currency = "AED" }: Props) {
  const [open, setOpen] = useState(false);

  const categories = Array.from(
    transactions
      .filter((t) => t.debit && t.debit > 0)
      .reduce((acc, t) => {
        const name = t.category?.name ?? "Others";
        const color = t.category?.color ?? "#6B7280";
        const prev = acc.get(name);
        acc.set(name, { amount: (prev?.amount ?? 0) + t.debit!, color });
        return acc;
      }, new Map<string, { amount: number; color: string }>())
  )
    .map(([name, { amount, color }]) => ({ name, amount, color }))
    .sort((a, b) => b.amount - a.amount);

  const total = categories.reduce((s, c) => s + c.amount, 0);

  if (categories.length === 0) return null;

  return (
    <div className="bg-surface border border-border rounded-2xl shadow-surface overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 border-b border-border hover:bg-elevated transition-colors"
      >
        <div className="flex items-center gap-2">
          <PieChart className="w-4 h-4 text-text-muted" />
          <span className="text-sm font-semibold text-text-primary">Expense Breakdown</span>
          <span className="text-xs font-mono text-text-muted">
            {currency} {fmt(total)}
          </span>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-text-muted" />
        ) : (
          <ChevronDown className="w-4 h-4 text-text-muted" />
        )}
      </button>

      {open && (
        <div className="p-5 space-y-3">
          {categories.map((cat) => {
            const pct = total > 0 ? (cat.amount / total) * 100 : 0;
            return (
              <div key={cat.name} className="flex items-center gap-3">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-text-secondary truncate">{cat.name}</span>
                    <span className="tabular-nums font-mono text-text-primary ml-2 shrink-0">
                      {currency} {fmt(cat.amount)}
                      <span className="text-text-muted ml-1.5">{pct.toFixed(1)}%</span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
