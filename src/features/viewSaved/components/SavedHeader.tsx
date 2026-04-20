import { Calendar, ArrowLeft, CreditCard } from "lucide-react";
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
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-elevated transition-colors shrink-0"
            aria-label="Back to statements"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <p className="text-xs text-text-muted font-mono font-medium uppercase tracking-widest">
              Saved Statement
            </p>
            <h1 className="font-display text-lg font-bold text-text-primary truncate">
              {statement.bank}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(from || to) && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary bg-elevated border border-border px-2.5 py-1 rounded-full">
              <Calendar className="w-3.5 h-3.5 text-text-muted" />
              {from || "—"} – {to || "—"}
            </span>
          )}
          {statement.card_type && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary bg-elevated border border-border px-2.5 py-1 rounded-full capitalize">
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
            { label: "Transactions", value: statement.summary.record_count.toString(), color: "text-text-primary" },
            { label: "Credit", value: `AED ${fmt(statement.summary.total_credit)}`, color: "text-success" },
            { label: "Debit", value: `AED ${fmt(statement.summary.total_debit)}`, color: "text-danger" },
            {
              label: "Net Change",
              value: `${statement.summary.net_change >= 0 ? "+" : ""}AED ${fmt(statement.summary.net_change)}`,
              color: statement.summary.net_change >= 0 ? "text-success" : "text-danger",
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-surface border border-border rounded-xl shadow-surface px-4 py-3">
              <p className="text-[11px] font-mono text-text-muted uppercase tracking-wide font-medium">{label}</p>
              <p className={`font-display text-sm font-bold tabular-nums mt-0.5 ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
