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
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div className="min-w-0">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Parsed Statement</p>
          <h1 className="text-lg font-bold text-slate-900 truncate">{bank || "Unknown Bank"}</h1>
        </div>
      </div>

      {/* Right: badges + save */}
      <div className="flex flex-wrap items-center gap-2">
        {(from || to) && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">From</span>
            {from || "—"}
            <span className="text-slate-400">to</span>
            {to || "—"}
          </span>
        )}
        {due && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-400">Due</span>
            {due}
          </span>
        )}
        {cardType && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full capitalize">
            <CreditCard className="w-3.5 h-3.5" />
            {cardType}
          </span>
        )}
        {parsedBy === "ai" && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 bg-violet-50 border border-violet-100 px-2.5 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            Parsed with AI
          </span>
        )}
        {parsedData && <SaveToCloudButton parsedData={parsedData} />}
      </div>
    </div>
  );
}
