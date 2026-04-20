"use client";

import { useState, useMemo } from "react";
import { Search, ArrowDown, ArrowUp, FileText } from "lucide-react";
import { DashboardTransaction } from "@/app/dashboard/page";

export default function TransactionsTable({
  transactions,
}: {
  transactions: DashboardTransaction[];
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return transactions;
    const t = search.toLowerCase();
    return transactions.filter(
      (tx) =>
        tx.description?.toLowerCase().includes(t) ||
        tx.category?.toLowerCase().includes(t)
    );
  }, [transactions, search]);

  return (
    <div className="bg-surface border border-border rounded-2xl shadow-surface overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-5 py-4 border-b border-border">
        <p className="font-display text-sm font-semibold text-text-primary">
          Transactions
          <span className="ml-2 text-xs font-normal font-mono text-text-muted">
            {filtered.length} of {transactions.length}
          </span>
        </p>
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="w-full pl-8 pr-3 py-2 text-sm font-mono bg-base border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14">
          <FileText className="w-8 h-8 mb-2 text-text-muted" />
          <p className="text-sm text-text-muted">No transactions found</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <ul className="divide-y divide-border md:hidden">
            {filtered.map((tx, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{tx.description}</p>
                  <p className="text-xs font-mono text-text-muted mt-0.5">{tx.date}</p>
                </div>
                <span
                  className={`text-sm font-semibold font-mono tabular-nums shrink-0 ${
                    tx.amount >= 0 ? "text-success" : "text-danger"
                  }`}
                >
                  {tx.amount >= 0 ? "+" : ""}
                  {tx.amount.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-base">
                  {["Date", "Description", "Category", "Type", "Amount"].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-2.5 text-[11px] font-semibold font-mono text-text-muted uppercase tracking-widest ${
                        h === "Amount" ? "text-right" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((tx, i) => (
                  <tr key={i} className="hover:bg-elevated transition-colors duration-100">
                    <td className="px-4 py-3 font-mono text-text-secondary whitespace-nowrap text-sm">{tx.date}</td>
                    <td className="px-4 py-3 font-medium text-text-primary max-w-xs truncate">{tx.description}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-elevated text-text-secondary border border-border">
                        {tx.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{tx.type}</td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex items-center gap-1 text-sm font-semibold font-mono tabular-nums ${
                          tx.amount >= 0 ? "text-success" : "text-danger"
                        }`}
                      >
                        {tx.amount >= 0 ? (
                          <ArrowDown className="w-3 h-3" />
                        ) : (
                          <ArrowUp className="w-3 h-3" />
                        )}
                        AED {Math.abs(tx.amount).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
