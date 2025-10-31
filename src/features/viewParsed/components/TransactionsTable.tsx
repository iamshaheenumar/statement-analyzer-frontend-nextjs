import { Transaction } from "@/features/dashboard/types";
import { formatDate } from "@/utils/date";
import {
  ClipboardList,
  FileText,
  ArrowDown,
  ArrowUp,
  Trash2,
  Search,
  CalendarDays,
} from "lucide-react";

type Props = {
  transactions: Transaction[];
  onRemove?: (tx: Transaction) => void;
  searchTerm?: string;
  dateFrom?: string;
  dateTo?: string;
};

export default function TransactionsTable({
  transactions,
  onRemove,
  searchTerm,
  dateFrom,
  dateTo,
}: Props) {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 overflow-hidden mb-8">
      {/* Table Header */}
      <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Transaction History
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {transactions?.length || 0}{" "}
                {transactions?.length === 1 ? "transaction" : "transactions"}{" "}
                found
              </p>
              {(searchTerm?.trim() || dateFrom || dateTo) && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {searchTerm?.trim() && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                      <Search className="w-3.5 h-3.5" /> "{searchTerm}"
                    </span>
                  )}
                  {dateFrom && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                      <CalendarDays className="w-3.5 h-3.5" /> From: {dateFrom}
                    </span>
                  )}
                  {dateTo && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                      <CalendarDays className="w-3.5 h-3.5" /> To: {dateTo}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Live Data tag removed as requested */}
        </div>
      </div>

      {/* Mobile (cards) */}
      <div className="block md:hidden">
        {!transactions || transactions.length === 0 ? (
          <div className="p-8 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium mb-1">
                No transactions found
              </p>
              <p className="text-sm text-gray-400">
                Try adjusting your filters
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {transactions.map((t, i) => (
              <div
                key={i}
                className="p-4 sm:p-5 flex items-start justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 text-[11px] font-bold">
                      {formatDate(t.transaction_date)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 font-medium truncate">
                    {t.description || "-"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {t.debit ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600">
                      <ArrowDown className="w-4 h-4" />
                      <span className="text-sm font-bold">
                        {typeof t.debit === "number"
                          ? t.debit.toFixed(2)
                          : t.debit}
                      </span>
                    </div>
                  ) : t.credit ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-50 text-green-600">
                      <ArrowUp className="w-4 h-4" />
                      <span className="text-sm font-bold">
                        {typeof t.credit === "number"
                          ? t.credit.toFixed(2)
                          : t.credit}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}

                  {onRemove && (
                    <button
                      title="Remove transaction"
                      aria-label="Remove transaction"
                      onClick={() => onRemove(t)}
                      className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 border-b-2 border-gray-200">
              <th className="px-6 py-4 text-left">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                  #
                </span>
              </th>
              <th className="px-6 py-4 text-left">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Date
                </span>
              </th>
              <th className="px-6 py-4 text-left">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Description
                </span>
              </th>
              <th className="px-6 py-4 text-right">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Debit (AED)
                </span>
              </th>
              <th className="px-6 py-4 text-right">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                  Credit (AED)
                </span>
              </th>
              {onRemove && (
                <th className="px-6 py-4 text-right">
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Actions
                  </span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!transactions || transactions.length === 0 ? (
              <tr>
                <td
                  colSpan={onRemove ? 6 : 5}
                  className="px-6 py-16 text-center"
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium mb-1">
                      No transactions found
                    </p>
                    <p className="text-sm text-gray-400">
                      Try adjusting your filters
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              transactions.map((t, i: number) => (
                <tr
                  key={i}
                  className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-200"
                >
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">
                      {formatDate(t.transaction_date)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-md">
                      <p className="text-sm text-gray-800 font-medium group-hover:text-gray-900 truncate">
                        {t.description || "-"}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {t.debit ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 group-hover:bg-red-100 transition-colors">
                        <ArrowDown className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-bold text-red-600">
                          {typeof t.debit === "number"
                            ? t.debit.toFixed(2)
                            : t.debit}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {t.credit ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 group-hover:bg-green-100 transition-colors">
                        <ArrowUp className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-bold text-green-600">
                          {typeof t.credit === "number"
                            ? t.credit.toFixed(2)
                            : t.credit}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  {onRemove && (
                    <td className="px-6 py-4 text-right">
                      <button
                        title="Remove transaction"
                        aria-label="Remove transaction"
                        onClick={() => onRemove(t)}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
