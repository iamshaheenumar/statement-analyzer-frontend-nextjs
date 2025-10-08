import { format, parseISO } from "date-fns";
import { Transaction } from "./types";

type Props = {
  transactions: Transaction[];
};

export default function TransactionsTable({ transactions }: Props) {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 overflow-hidden mb-8">
      {/* Table Header */}
      <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
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
            </div>
          </div>

          {transactions?.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="text-xs font-semibold text-blue-700">
                Live Data
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
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
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!transactions || transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
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
              transactions.map((t: any, i: number) => (
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
                      {t.transaction_date || t.date || "-"}
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
                        <svg
                          className="w-4 h-4 text-red-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 14l-7 7m0 0l-7-7m7 7V3"
                          />
                        </svg>
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
                        <svg
                          className="w-4 h-4 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 10l7-7m0 0l7 7m-7-7v18"
                          />
                        </svg>
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
