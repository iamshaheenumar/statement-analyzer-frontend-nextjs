"use client";

import { useState, useMemo } from "react";
import { Search, ArrowDown, ArrowUp, FileText, ChevronDown, X } from "lucide-react";
import { DashboardTransaction } from "@/app/dashboard/page";

export default function TransactionsTable({
  transactions,
}: {
  transactions: DashboardTransaction[];
}) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const categories = useMemo(() => {
    const seen = new Map<string, string>();
    for (const tx of transactions) {
      if (!seen.has(tx.category)) seen.set(tx.category, tx.categoryColor);
    }
    return Array.from(seen.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, color]) => ({ name, color }));
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch =
        !search ||
        tx.description?.toLowerCase().includes(search.toLowerCase()) ||
        tx.category?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !selectedCategory || tx.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [transactions, search, selectedCategory]);

  const activeCategoryColor = selectedCategory
    ? categories.find((c) => c.name === selectedCategory)?.color
    : undefined;

  return (
    <div className="bg-surface border border-border rounded-2xl shadow-surface overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-3 px-4 sm:px-5 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <p className="font-display text-sm font-semibold text-text-primary">
            Transactions
            <span className="ml-2 text-xs font-normal font-mono text-text-muted">
              {filtered.length} of {transactions.length}
            </span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full pl-8 pr-3 py-2 text-sm font-mono bg-base border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition"
            />
          </div>

          {/* Category filter */}
          <div className="relative sm:w-48">
            {activeCategoryColor && (
              <span
                className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                style={{ backgroundColor: activeCategoryColor }}
              />
            )}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`w-full appearance-none py-2 pr-8 text-sm font-mono bg-base border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition ${
                activeCategoryColor ? "pl-7" : "pl-3"
              }`}
            >
              <option value="">All categories</option>
              {categories.map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
          </div>

          {/* Clear filters */}
          {(search || selectedCategory) && (
            <button
              onClick={() => { setSearch(""); setSelectedCategory(""); }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono text-text-muted hover:text-text-primary border border-border rounded-lg bg-base hover:bg-elevated transition shrink-0"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
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
                  <p className="text-xs font-mono text-text-muted mt-0.5">
                    {tx.date}
                    <span
                      className="ml-2 inline-flex items-center gap-1"
                      style={{ color: tx.categoryColor }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full inline-block"
                        style={{ backgroundColor: tx.categoryColor }}
                      />
                      {tx.category}
                    </span>
                  </p>
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
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border"
                        style={{
                          backgroundColor: `${tx.categoryColor}22`,
                          borderColor: `${tx.categoryColor}55`,
                          color: tx.categoryColor,
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: tx.categoryColor }}
                        />
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
