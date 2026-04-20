"use client";

type ExpenseCat = { name: string; amount: number; color: string };
type Props = {
  monthlyData: { income: number; expenses: number };
  expenseCategories: ExpenseCat[];
};

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Charts({ monthlyData, expenseCategories }: Props) {
  const max = Math.max(monthlyData.income, monthlyData.expenses, 1);
  const incomeW  = (monthlyData.income   / max) * 100;
  const expenseW = (monthlyData.expenses / max) * 100;

  const totalExpenses = expenseCategories.reduce((s, c) => s + c.amount, 0) || 1;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* Income vs Expenses */}
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-surface">
        <p className="text-sm font-semibold text-text-primary mb-4">Income vs Expenses</p>
        <div className="space-y-4">
          {[
            { label: "Income",   value: monthlyData.income,   width: incomeW,  bar: "bg-success" },
            { label: "Expenses", value: monthlyData.expenses, width: expenseW, bar: "bg-danger"  },
          ].map(({ label, value, width, bar }) => (
            <div key={label}>
              <div className="flex justify-between text-xs font-medium text-text-secondary mb-1.5">
                <span>{label}</span>
                <span className="tabular-nums font-mono font-semibold text-text-primary">AED {fmt(value)}</span>
              </div>
              <div className="h-2.5 bg-elevated rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${bar}`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          ))}
          {monthlyData.expenses > monthlyData.income && (
            <p className="text-xs text-danger font-medium">
              Expenses exceed income this period.
            </p>
          )}
        </div>
      </div>

      {/* Expense Categories */}
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-surface">
        <p className="text-sm font-semibold text-text-primary mb-4">Expense Breakdown</p>
        {expenseCategories.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-6">No expense data</p>
        ) : (
          <div className="space-y-3">
            {expenseCategories.slice(0, 5).map((cat, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-xs font-medium text-text-secondary mb-1">
                    <span className="truncate">{cat.name}</span>
                    <span className="tabular-nums font-mono text-text-primary ml-2">
                      AED {fmt(cat.amount)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(cat.amount / totalExpenses) * 100}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
