"use client";

import { ClipboardList, CircleDollarSign, ChevronRight } from "lucide-react";

type StatementItem = {
  id: string;
  bank: string;
  created_at: string | Date;
  summary: {
    record_count: number;
    total_debit: number;
    total_credit: number;
    net_change: number;
  };
};

type Props = {
  items: StatementItem[];
};

export default function StatementsList({ items }: Props) {
  if (!items || items.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Saved Statements</h2>
        </div>

        <div className="py-8 text-center">
          <p className="text-gray-500 font-medium mb-1">No saved statements yet</p>
          <p className="text-sm text-gray-400">Use "Save to Cloud" to store a parsed statement</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Saved Statements</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{items.length} item{items.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {items.map((p, i) => (
          <div
            key={p.id}
            className="group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center flex-shrink-0">
                  <ClipboardList className="w-4 h-4 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-bold text-gray-900 truncate">{p.bank}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{new Date(p.created_at).toLocaleString()}</span>
                    <span className="hidden sm:inline-block h-3 w-px bg-gray-300" />
                    <span>{p.summary.record_count} txns</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:justify-end">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-50">
                <CircleDollarSign className="w-4 h-4 text-gray-500" />
                <span
                  className={`text-xs sm:text-sm font-bold ${
                    p.summary.net_change >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  Net {p.summary.net_change >= 0 ? "+" : ""}
                  {p.summary.net_change.toFixed(2)} AED
                </span>
              </div>

              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

