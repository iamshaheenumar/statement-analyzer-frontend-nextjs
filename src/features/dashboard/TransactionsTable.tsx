"use client";

import React, { useState, useMemo } from "react";
import { Search, Banknote } from "lucide-react";
import { DashboardTransaction } from "@/app/dashboard/page";

export default function TransactionsTable({
  transactions,
  onRemove,
}: {
  transactions: DashboardTransaction[];
  onRemove?: (tx: DashboardTransaction) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTransactions = useMemo(() => {
    if (!searchTerm) return transactions;
    const term = searchTerm.toLowerCase();
    return transactions.filter(
      (tx) =>
        tx.description?.toLowerCase().includes(term) ||
        tx.category?.toLowerCase().includes(term) ||
        tx.type?.toLowerCase().includes(term)
    );
  }, [transactions, searchTerm]);
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
            <Banknote className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            Recent Transactions
          </h3>
        </div>

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
              {onRemove && (
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-600 uppercase">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredTransactions.map((txn: any, i: number) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4 text-sm text-gray-600">
                  {txn.transaction_date ?? txn.date ?? "-"}
                </td>
                <td className="px-4 py-4 text-sm font-medium text-gray-900">
                  {txn.description ?? txn.description_raw ?? "-"}
                </td>
                <td className="px-4 py-4">
                  <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                    {txn.category ?? txn.category_name ?? "-"}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">
                  {txn.type ?? txn.card_type ?? "-"}
                </td>
                <td
                  className={`px-4 py-4 text-sm font-bold text-right ${
                    (txn.amount ?? txn.debit ?? txn.credit) > 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {txn.amount
                    ? txn.amount > 0
                      ? "+"
                      : "-"
                    : txn.credit
                    ? "+"
                    : txn.debit
                    ? "-"
                    : ""}
                  AED{" "}
                  {Math.abs(
                    (txn.amount ?? txn.debit ?? txn.credit) || 0
                  ).toFixed(2)}
                </td>
                {onRemove && (
                  <td className="px-4 py-4 text-right">
                    <button
                      title="Remove transaction"
                      aria-label="Remove transaction"
                      onClick={() => onRemove(txn)}
                      className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors shadow-sm"
                    >
                      Remove
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
