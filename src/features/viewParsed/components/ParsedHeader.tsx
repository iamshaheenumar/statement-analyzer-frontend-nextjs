"use client";

import { ArrowLeft, Calendar, CreditCard, Sparkles, TrendingDown, TrendingUp, Wallet, Receipt } from "lucide-react";
import { format, parseISO } from "date-fns";
import SaveToCloudButton from "./SaveToCloudButton";
import type { ParsedDataWithId } from "@/features/dashboard/types";

type Props = {
  bank?: string;
  fromDate?: string | null;
  toDate?: string | null;
  issuedDate?: string | null;
  dueDate?: string | null;
  cardType?: string | null;
  cardVariant?: string | null;
  creditLimit?: number | null;
  availableCredit?: number | null;
  minPaymentDue?: number | null;
  totalOutstanding?: number | null;
  totalAmountDue?: number | null;
  parsedBy?: string | null;
  parsedData?: ParsedDataWithId | null;
  onBack?: () => void;
  onReparseWithAI?: () => void;
  isReparsing?: boolean;
};

function fmt(value?: string | null) {
  if (!value) return null;
  try {
    const d = parseISO(value);
    return Number.isNaN(d.getTime()) ? value : format(d, "dd MMM yyyy");
  } catch {
    return value;
  }
}

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

export default function ParsedHeader({
  bank,
  fromDate,
  toDate,
  issuedDate,
  dueDate,
  cardType,
  cardVariant,
  creditLimit,
  availableCredit,
  minPaymentDue,
  totalOutstanding,
  totalAmountDue,
  parsedBy,
  parsedData,
  onBack,
  onReparseWithAI,
  isReparsing,
}: Props) {
  const from = fmt(fromDate);
  const to = fmt(toDate);
  const due = fmt(dueDate);
  const issued = fmt(issuedDate);
  const currency = parsedData?.currency || parsedData?.summary?.currency || "AED";
  const isCredit = cardType === "credit";

  const metaItems = [
    from && to && { label: "Period", value: `${from} – ${to}`, icon: Calendar },
    issued && { label: "Issued", value: issued, icon: Calendar },
    due && { label: "Due", value: due, icon: Calendar, highlight: "warning" as const },
    cardType && { label: "Card type", value: cardType, icon: CreditCard },
  ].filter(Boolean) as { label: string; value: string; icon: React.ElementType; highlight?: "warning" }[];

  return (
    <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
      {/* Top row: identity + actions */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-elevated transition-colors shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="min-w-0">
            <p className="text-[10px] text-text-muted font-mono font-medium uppercase tracking-widest mb-0.5">
              Parsed Statement
            </p>
            <h1 className="font-display text-xl font-bold text-text-primary truncate">
              {bank || "Unknown Bank"}
            </h1>
            {cardVariant && (
              <p className="text-xs text-text-secondary mt-0.5">{cardVariant}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 pt-0.5">
          {parsedBy === "ai" && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent bg-accent-muted border border-accent/20 px-2.5 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              AI parsed
            </span>
          )}
          {parsedBy === "config" && onReparseWithAI && (
            <button
              onClick={onReparseWithAI}
              disabled={isReparsing}
              className="inline-flex items-center gap-2 text-sm font-medium bg-elevated border border-border hover:border-accent hover:text-accent text-text-secondary px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" />
              {isReparsing ? "Reparsing…" : "Reparse with AI"}
            </button>
          )}
          {parsedData && <SaveToCloudButton parsedData={parsedData} />}
        </div>
      </div>

      {/* Meta row: dates, card type */}
      {metaItems.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-border pt-3">
          {metaItems.map(({ label, value, icon: Icon, highlight }) => (
            <div key={label} className={`flex items-center gap-1.5 text-xs ${highlight === "warning" ? "text-warning" : "text-text-secondary"}`}>
              <Icon className={`w-3.5 h-3.5 ${highlight === "warning" ? "text-warning" : "text-text-muted"}`} />
              <span className={highlight === "warning" ? "text-warning/60" : "text-text-muted"}>{label}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Stats row */}
      {parsedData?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatCard
            label="Transactions"
            value={parsedData.summary.record_count}
            icon={Receipt}
          />
          {!isCredit && parsedData.summary.total_debit > 0 && (
            <StatCard
              label="Total Debit"
              value={fmtAmount(parsedData.summary.total_debit, currency) ?? "—"}
              icon={TrendingDown}
              variant="danger"
            />
          )}
          {!isCredit && parsedData.summary.total_credit > 0 && (
            <StatCard
              label="Total Credit"
              value={fmtAmount(parsedData.summary.total_credit, currency) ?? "—"}
              icon={TrendingUp}
              variant="success"
            />
          )}
          {isCredit && totalAmountDue != null && (
            <StatCard
              label="Total Amount Due"
              value={fmtAmount(totalAmountDue, currency) ?? "—"}
              icon={TrendingDown}
              variant="danger"
            />
          )}
          {isCredit && minPaymentDue != null && (
            <StatCard
              label="Min Amount Due"
              value={fmtAmount(minPaymentDue, currency) ?? "—"}
              variant="warning"
            />
          )}
          {isCredit && totalOutstanding != null && (
            <StatCard
              label="Outstanding"
              value={fmtAmount(totalOutstanding, currency) ?? "—"}
              icon={Wallet}
            />
          )}
          {isCredit && creditLimit != null && (
            <StatCard
              label="Credit Limit"
              value={fmtAmount(creditLimit, currency) ?? "—"}
              sub={availableCredit != null ? `${fmtAmount(availableCredit, currency)} available` : undefined}
            />
          )}
        </div>
      )}
    </div>
  );
}
