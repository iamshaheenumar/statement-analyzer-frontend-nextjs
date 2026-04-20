"use client";

import { ArrowLeft, Calendar, CreditCard, Sparkles } from "lucide-react";
import { format, parseISO } from "date-fns";
import SaveToCloudButton from "./SaveToCloudButton";
import type { ParsedDataWithId } from "@/features/dashboard/types";

type Props = {
  bank?: string;
  fromDate?: string | null;
  toDate?: string | null;
  dueDate?: string | null;
  cardType?: string | null;
  parsedBy?: string | null;
  parsedData?: ParsedDataWithId | null;
  onBack?: () => void;
  saving?: boolean;
  onSavingChange?: (value: boolean) => void;
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

export default function ParsedHeader({
  bank,
  fromDate,
  toDate,
  dueDate,
  cardType,
  parsedBy,
  parsedData,
  onBack,
}: Props) {
  const from = fmt(fromDate);
  const to = fmt(toDate);
  const due = fmt(dueDate);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: back + bank name */}
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
          <p className="text-xs text-text-muted font-mono font-medium uppercase tracking-widest">
            Parsed Statement
          </p>
          <h1 className="font-display text-lg font-bold text-text-primary truncate">
            {bank || "Unknown Bank"}
          </h1>
        </div>
      </div>

      {/* Right: badges + save */}
      <div className="flex flex-wrap items-center gap-2">
        {(from || to) && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary bg-elevated border border-border px-2.5 py-1 rounded-full">
            <Calendar className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-text-muted">From</span>
            {from || "—"}
            <span className="text-text-muted">to</span>
            {to || "—"}
          </span>
        )}
        {due && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-warning bg-warning-muted border border-warning/20 px-2.5 py-1 rounded-full">
            <Calendar className="w-3.5 h-3.5 text-warning" />
            <span className="text-warning/70">Due</span>
            {due}
          </span>
        )}
        {cardType && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary bg-elevated border border-border px-2.5 py-1 rounded-full capitalize">
            <CreditCard className="w-3.5 h-3.5" />
            {cardType}
          </span>
        )}
        {parsedBy === "ai" && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent bg-accent-muted border border-accent/20 px-2.5 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            Parsed with AI
          </span>
        )}
        {parsedData && <SaveToCloudButton parsedData={parsedData} />}
      </div>
    </div>
  );
}
