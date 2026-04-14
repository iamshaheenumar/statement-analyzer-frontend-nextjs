import { Transaction } from "@/features/dashboard/types";
import { formatDate } from "@/utils/date";
import { FileText, ArrowDown, ArrowUp, Trash2 } from "lucide-react";

type Props = {
  transactions: Transaction[];
  onRemove?: (tx: Transaction) => void;
  searchTerm?: string;
};

const fmt = (n: number | string) =>
  Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function TransactionsTable({ transactions, onRemove, searchTerm }: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800">
          Transactions
          <span className="ml-2 text-xs font-normal text-slate-400">
            {transactions.length} {searchTerm?.trim() ? "filtered" : "total"}
          </span>
        </p>
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-slate-400">
          <FileText className="w-8 h-8 mb-2" />
          <p className="text-sm">No transactions found</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <ul className="divide-y divide-slate-100 md:hidden">
            {transactions.map((t, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 truncate">{t.description || "—"}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatDate(t.transaction_date)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {t.debit ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                      <ArrowDown className="w-3 h-3" />
                      {fmt(t.debit)}
                    </span>
                  ) : t.credit ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
                      <ArrowUp className="w-3 h-3" />
                      {fmt(t.credit)}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                  {onRemove && (
                    <button
                      onClick={() => onRemove(t)}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Remove transaction"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["#", "Date", "Description", "Debit (AED)", "Credit (AED)"].map((h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide ${
                        i >= 3 ? "text-right" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                  {onRemove && <th className="px-4 py-2.5" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((t, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-400 tabular-nums">{i + 1}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {formatDate(t.transaction_date)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800 max-w-xs truncate">
                      {t.description || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {t.debit ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-red-600 tabular-nums">
                          <ArrowDown className="w-3 h-3" />
                          {fmt(t.debit)}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {t.credit ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-green-600 tabular-nums">
                          <ArrowUp className="w-3 h-3" />
                          {fmt(t.credit)}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    {onRemove && (
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => onRemove(t)}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="Remove transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
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
