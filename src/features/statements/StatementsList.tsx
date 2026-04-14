"use client";

import { ChevronRight, FileText, Upload, Calendar } from "lucide-react";
import { DeleteButton } from "./DeleteStatementButton";
import { formatDate } from "@/utils/date";

type StatementItem = {
  id: string;
  bank: string;
  created_at: string | Date;
  card_type?: string | null;
  from_date: Date | null;
  to_date: Date | null;
  summary: {
    record_count: number;
    total_debit: number;
    total_credit: number;
    net_change: number;
  };
};

type Props = { items: StatementItem[] };

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function StatementsList({ items }: Props) {
  if (!items || items.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
            <FileText className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700 mb-1">No saved statements</p>
          <p className="text-xs text-slate-400 mb-5">
            Use &ldquo;Save to Cloud&rdquo; after parsing a PDF to store it here.
          </p>
          <a
            href="/upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Statement
          </a>
        </div>
      </div>
    );
  }

  const totalTx = items.reduce((s, i) => s + i.summary.record_count, 0);

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Statements", value: items.length.toString() },
          { label: "Transactions", value: totalTx.toString() },
          {
            label: "Net Change",
            value: `AED ${fmt(items.reduce((s, i) => s + i.summary.net_change, 0))}`,
          },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-xl shadow-sm px-4 py-3">
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">{label}</p>
            <p className="text-lg font-bold text-slate-800 tabular-nums mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <ul className="divide-y divide-slate-100">
          {items.map((item) => (
            <li key={item.id} className="relative group">
              <a
                href={`/view-saved?id=${item.id}`}
                className="block px-4 sm:px-5 py-4 hover:bg-slate-50 transition-colors"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{item.bank}</p>
                    {(item.from_date || item.to_date) && (
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-400">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {formatDate(item.from_date)} – {formatDate(item.to_date)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.card_type && (
                      <span className="hidden sm:inline text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full capitalize">
                        {item.card_type}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                  <div>
                    <p className="text-[11px] text-slate-400">Transactions</p>
                    <p className="text-xs font-semibold text-slate-700 tabular-nums">
                      {item.summary.record_count}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400">Debit</p>
                    <p className="text-xs font-semibold text-red-600 tabular-nums">
                      AED {fmt(item.summary.total_debit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400">Credit</p>
                    <p className="text-xs font-semibold text-green-600 tabular-nums">
                      AED {fmt(item.summary.total_credit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400">Net</p>
                    <p
                      className={`text-xs font-semibold tabular-nums ${
                        item.summary.net_change >= 0 ? "text-blue-600" : "text-red-500"
                      }`}
                    >
                      {item.summary.net_change >= 0 ? "+" : ""}
                      AED {fmt(item.summary.net_change)}
                    </p>
                  </div>
                </div>
              </a>

              {/* Delete button — positioned top-right, outside the link */}
              <div className="absolute top-3 right-10 sm:right-12">
                <DeleteButton id={item.id} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
