import { ArrowLeft, Calendar, CreditCard, TrendingDown, TrendingUp, Wallet, Receipt } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { DeleteButton } from "@/features/statements/DeleteStatementButton";

type Statement = {
  id: string;
  bank: string;
  card_type?: string | null;
  card_variant?: string | null;
  from_date: Date | null;
  to_date: Date | null;
  issued_date?: Date | null;
  created_at: Date;
  currency: string;
  credit_limit?: number | null;
  available_credit?: number | null;
  min_payment_due?: number | null;
  total_outstanding?: number | null;
  total_amount_due?: number | null;
  summary?: {
    record_count: number;
    total_debit: number;
    total_credit: number;
    net_change: number;
  };
};

function fmtAmount(value?: number | null, currency = "AED") {
  if (value == null) return null;
  return `${currency} ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StatCard({
  label,
  value,
  icon: Icon,
  variant = "default",
  sub,
}: {
  label: string;
  value: string | number;
  icon?: React.ElementType;
  variant?: "default" | "danger" | "success" | "warning";
  sub?: string;
}) {
  const styles = {
    default: "bg-elevated border-border text-text-primary",
    danger: "bg-danger-muted border-danger/20 text-danger",
    success: "bg-success-muted border-success/20 text-success",
    warning: "bg-warning-muted border-warning/20 text-warning",
  };
  const labelStyles = {
    default: "text-text-muted",
    danger: "text-danger/60",
    success: "text-success/60",
    warning: "text-warning/60",
  };

  return (
    <div className={`flex flex-col gap-1 border rounded-lg px-3 py-2.5 ${styles[variant]}`}>
      <span className={`text-xs font-medium uppercase tracking-wide ${labelStyles[variant]}`}>{label}</span>
      <div className="flex items-baseline gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 shrink-0 self-center opacity-70" />}
        <span className="text-sm font-semibold leading-tight">{value}</span>
      </div>
      {sub && <span className="text-xs opacity-60">{sub}</span>}
    </div>
  );
}

export default function SavedHeader({ statement }: { statement: Statement }) {
  const cur = statement.currency ?? "AED";
  const isCredit = statement.card_type?.toLowerCase() === "credit";

  const from = statement.from_date ? format(new Date(statement.from_date), "dd MMM yyyy") : null;
  const to = statement.to_date ? format(new Date(statement.to_date), "dd MMM yyyy") : null;
  const issued = statement.issued_date ? format(new Date(statement.issued_date), "dd MMM yyyy") : null;

  const metaItems = [
    from && to && { label: "Period", value: `${from} – ${to}`, icon: Calendar },
    issued && { label: "Issued", value: issued, icon: Calendar },
    statement.card_type && { label: "Card type", value: statement.card_type, icon: CreditCard },
  ].filter(Boolean) as { label: string; value: string; icon: React.ElementType }[];

  return (
    <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
      {/* Top row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/statements"
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-elevated transition-colors shrink-0"
            aria-label="Back to statements"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <p className="text-[10px] text-text-muted font-mono font-medium uppercase tracking-widest mb-0.5">
              Saved Statement
            </p>
            <h1 className="font-display text-xl font-bold text-text-primary truncate">
              {statement.bank}
            </h1>
            {statement.card_variant && (
              <p className="text-xs text-text-secondary mt-0.5">{statement.card_variant}</p>
            )}
          </div>
        </div>

        <div className="shrink-0 pt-0.5">
          <DeleteButton id={statement.id} />
        </div>
      </div>

      {/* Meta row */}
      {metaItems.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-border pt-3">
          {metaItems.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Icon className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-text-muted">{label}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Stats row */}
      {statement.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatCard label="Transactions" value={statement.summary.record_count} icon={Receipt} />
          {!isCredit && statement.summary.total_debit > 0 && (
            <StatCard label="Total Debit" value={fmtAmount(statement.summary.total_debit, cur) ?? "—"} icon={TrendingDown} variant="danger" />
          )}
          {!isCredit && statement.summary.total_credit > 0 && (
            <StatCard label="Total Credit" value={fmtAmount(statement.summary.total_credit, cur) ?? "—"} icon={TrendingUp} variant="success" />
          )}
          {isCredit && statement.total_amount_due != null && (
            <StatCard label="Total Amount Due" value={fmtAmount(statement.total_amount_due, cur) ?? "—"} icon={TrendingDown} variant="danger" />
          )}
          {isCredit && statement.min_payment_due != null && (
            <StatCard label="Min Amount Due" value={fmtAmount(statement.min_payment_due, cur) ?? "—"} variant="warning" />
          )}
          {isCredit && statement.total_outstanding != null && (
            <StatCard label="Outstanding" value={fmtAmount(statement.total_outstanding, cur) ?? "—"} icon={Wallet} />
          )}
          {isCredit && statement.credit_limit != null && (
            <StatCard
              label="Credit Limit"
              value={fmtAmount(statement.credit_limit, cur) ?? "—"}
              sub={statement.available_credit != null ? `${fmtAmount(statement.available_credit, cur)} available` : undefined}
            />
          )}
        </div>
      )}
    </div>
  );
}
