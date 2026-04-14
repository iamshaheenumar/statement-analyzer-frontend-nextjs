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
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 sm:px-5 py-4 border-b border-slate-100">
        <p className="text-sm font-semibold text-slate-800">
          Transactions
          <span className="ml-2 text-xs font-normal text-slate-400">
            {filtered.length} of {transactions.length}
          </span>
        </p>
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-slate-400">
          <FileText className="w-8 h-8 mb-2" />
          <p className="text-sm">No transactions found</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <ul className="divide-y divide-slate-100 md:hidden">
            {filtered.map((tx, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{tx.description}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{tx.date}</p>
                </div>
                <span
                  className={`text-sm font-semibold tabular-nums shrink-0 ${
                    tx.amount >= 0 ? "text-green-600" : "text-red-500"
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
                <tr className="border-b border-slate-100 bg-slate-50">
                  {["Date", "Description", "Category", "Type", "Amount"].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide ${
                        h === "Amount" ? "text-right" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((tx, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{tx.date}</td>
                    <td className="px-4 py-3 font-medium text-slate-800 max-w-xs truncate">
                      {tx.description}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        {tx.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{tx.type}</td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-flex items-center gap-1 text-sm font-semibold tabular-nums ${
                          tx.amount >= 0 ? "text-green-600" : "text-red-500"
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
