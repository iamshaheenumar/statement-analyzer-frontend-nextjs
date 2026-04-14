import { Calendar, FileText, ArrowLeft, CreditCard } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

type Statement = {
  id: string;
  bank: string;
  card_type?: string | null;
  from_date: Date | null;
  to_date: Date | null;
  created_at: Date;
  summary?: {
    record_count: number;
    total_debit: number;
    total_credit: number;
    net_change: number;
  };
};

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function SavedHeader({ statement }: { statement: Statement }) {
  const from = statement.from_date ? format(new Date(statement.from_date), "dd MMM yyyy") : null;
  const to = statement.to_date ? format(new Date(statement.to_date), "dd MMM yyyy") : null;

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/statements"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
            aria-label="Back to statements"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Saved Statement</p>
            <h1 className="text-lg font-bold text-slate-900 truncate">{statement.bank}</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(from || to) && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
              <Calendar className="w-3.5 h-3.5" />
              {from || "—"} – {to || "—"}
            </span>
          )}
          {statement.card_type && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full capitalize">
              <CreditCard className="w-3.5 h-3.5" />
              {statement.card_type}
            </span>
          )}
        </div>
      </div>

      {/* Summary stats */}
      {statement.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Transactions", value: statement.summary.record_count.toString(), color: "text-slate-800" },
            { label: "Credit", value: `AED ${fmt(statement.summary.total_credit)}`, color: "text-green-600" },
            { label: "Debit", value: `AED ${fmt(statement.summary.total_debit)}`, color: "text-red-600" },
            {
              label: "Net Change",
              value: `${statement.summary.net_change >= 0 ? "+" : ""}AED ${fmt(statement.summary.net_change)}`,
              color: statement.summary.net_change >= 0 ? "text-blue-600" : "text-red-500",
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white border border-slate-200 rounded-xl shadow-sm px-4 py-3">
              <p className="text-[11px] text-slate-400 uppercase tracking-wide font-medium">{label}</p>
              <p className={`text-sm font-bold tabular-nums mt-0.5 ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
