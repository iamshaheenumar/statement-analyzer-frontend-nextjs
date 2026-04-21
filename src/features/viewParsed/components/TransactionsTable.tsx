"use client";

import { useState } from "react";
import { Transaction } from "@/features/dashboard/types";
import { formatDate } from "@/utils/date";
import {
  FileText, ArrowDown, ArrowUp, Trash2,
  Download, Copy, Table2, LayoutList, Check,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { staggerContainer, tableRow } from "@/lib/motion";

type ViewMode = "normal" | "spreadsheet";

type Props = {
  transactions: Transaction[];
  onRemove?: (tx: Transaction) => void;
  searchTerm?: string;
  bank?: string;
  fromDate?: string;
  toDate?: string;
  currency?: string;
  originalHeaders?: string[];
  rawRows?: string[][];
};

type ConfirmState = { index: number } | null;

const fmtNum = (n: number | string) =>
  Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function buildCSVFilename(bank?: string, from?: string, to?: string) {
  const parts = [bank || "statement", from, to].filter(Boolean);
  return parts.join("_").replace(/\s+/g, "-") + ".csv";
}

function downloadCSV(
  transactions: Transaction[], currency: string,
  bank?: string, from?: string, to?: string,
  originalHeaders?: string[], rawRows?: string[][],
) {
  let headers: string[];
  let rows: string[][];
  if (originalHeaders?.length && rawRows?.length) {
    headers = ["#", ...originalHeaders];
    rows = rawRows.map((r, i) => [String(i + 1), ...r.map(v => v.includes(',') ? `"${v.replace(/"/g, '""')}"` : v)]);
  } else {
    headers = ["Date", "Description", `Debit (${currency})`, `Credit (${currency})`, "FX Currency", "FX Amount"];
    rows = transactions.map((t) => [
      t.transaction_date ? String(t.transaction_date) : "",
      `"${(t.description || "").replace(/"/g, '""')}"`,
      t.debit ? Number(t.debit).toFixed(2) : "",
      t.credit ? Number(t.credit).toFixed(2) : "",
      t.fx_currency || "",
      t.fx_amount ? Number(t.fx_amount).toFixed(2) : "",
    ]);
  }
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = buildCSVFilename(bank, from, to);
  a.click();
  URL.revokeObjectURL(url);
}

async function copyAsTSV(
  transactions: Transaction[], currency: string,
  originalHeaders?: string[], rawRows?: string[][],
) {
  let headers: string[];
  let rows: string[][];
  if (originalHeaders?.length && rawRows?.length) {
    headers = ["#", ...originalHeaders];
    rows = rawRows.map((r, i) => [String(i + 1), ...r]);
  } else {
    headers = ["Date", "Description", `Debit (${currency})`, `Credit (${currency})`, "FX Currency", "FX Amount"];
    rows = transactions.map((t) => [
      t.transaction_date ? String(t.transaction_date) : "",
      t.description || "",
      t.debit ? Number(t.debit).toFixed(2) : "",
      t.credit ? Number(t.credit).toFixed(2) : "",
      t.fx_currency || "",
      t.fx_amount ? Number(t.fx_amount).toFixed(2) : "",
    ]);
  }
  const tsv = [headers, ...rows].map((r) => r.join("\t")).join("\n");
  await navigator.clipboard.writeText(tsv);
}

export default function TransactionsTable({
  transactions,
  onRemove,
  searchTerm,
  bank,
  fromDate,
  toDate,
  currency = "AED",
  originalHeaders,
  rawRows,
}: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("normal");
  const [copied, setCopied] = useState(false);

  const hasOriginal = !!(originalHeaders?.length && rawRows?.length);

  const handleCopy = async () => {
    try {
      await copyAsTSV(transactions, currency, originalHeaders, rawRows);
      setCopied(true);
      toast.success("Copied — paste directly into Excel or Google Sheets");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleDownload = () => {
    downloadCSV(transactions, currency, bank, fromDate, toDate, originalHeaders, rawRows);
    toast.success("CSV downloaded");
  };

  return (
    <div className="bg-surface border border-border rounded-2xl shadow-surface overflow-hidden">
      {/* Header bar */}
      <div className="px-4 sm:px-5 py-3.5 border-b border-border flex items-center justify-between gap-3 flex-wrap">
        <p className="font-display text-sm font-semibold text-text-primary">
          Transactions
          <span className="ml-2 text-xs font-normal font-mono text-text-muted">
            {transactions.length} {searchTerm?.trim() ? "filtered" : "total"}
          </span>
        </p>

        {transactions.length > 0 && (
          <div className="flex items-center gap-1.5">
            {/* View toggle */}
            <div className="flex items-center bg-base rounded-lg p-0.5 ring-1 ring-border">
              <button
                onClick={() => setViewMode("normal")}
                title="Normal view"
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "normal"
                    ? "bg-elevated text-text-primary ring-1 ring-border shadow-sm"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("spreadsheet")}
                title="Spreadsheet view"
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "spreadsheet"
                    ? "bg-elevated text-text-primary ring-1 ring-border shadow-sm"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                <Table2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Copy for Excel */}
            <button
              onClick={handleCopy}
              title="Copy for Excel / Google Sheets"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                copied
                  ? "text-success bg-success-muted"
                  : "text-text-secondary hover:text-text-primary hover:bg-elevated"
              }`}
            >
              {copied ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{copied ? "Copied!" : "Copy"}</span>
            </button>

            {/* Download CSV */}
            <button
              onClick={handleDownload}
              title="Download as CSV"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-elevated rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </button>
          </div>
        )}
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14">
          <FileText className="w-8 h-8 mb-2 text-text-muted" />
          <p className="text-sm text-text-muted">No transactions found</p>
        </div>
      ) : viewMode === "spreadsheet" ? (
        <SpreadsheetView transactions={transactions} currency={currency} originalHeaders={originalHeaders} rawRows={rawRows} />
      ) : hasOriginal ? (
        <OriginalView
          headers={originalHeaders!}
          rows={rawRows!}
          onRemove={onRemove ? (i) => onRemove(transactions[i]) : undefined}
        />
      ) : (
        <NormalView transactions={transactions} onRemove={onRemove} currency={currency} />
      )}
    </div>
  );
}

function NormalView({
  transactions,
  onRemove,
  currency,
}: {
  transactions: Transaction[];
  onRemove?: (tx: Transaction) => void;
  currency: string;
}) {
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const skipAnimation = transactions.length > 50;

  const handleRemoveClick = (i: number) => setConfirmState({ index: i });
  const handleConfirm = (t: Transaction) => { onRemove?.(t); setConfirmState(null); };
  const handleCancel = () => setConfirmState(null);

  return (
    <>
      {/* Mobile cards */}
      <ul className="divide-y divide-border md:hidden">
        {transactions.map((t, i) => (
          <li key={i} className="px-4 py-3">
            {confirmState?.index === i ? (
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-text-secondary">Remove this transaction?</p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleConfirm(t)}
                    className="px-2.5 py-1 text-xs font-semibold text-white bg-danger hover:bg-danger/80 rounded-md transition-colors"
                  >
                    Remove
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-2.5 py-1 text-xs font-semibold text-text-secondary bg-elevated hover:bg-overlay rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary truncate">{t.description || "—"}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-xs font-mono text-text-muted">{formatDate(t.transaction_date)}</p>
                    {t.fx_currency && (
                      <span className="text-[10px] font-medium font-mono text-accent bg-accent-muted border border-accent/20 px-1.5 py-0.5 rounded-full">
                        {t.fx_currency}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {t.debit ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold font-mono text-danger tabular-nums">
                      <ArrowDown className="w-3 h-3" />
                      {fmtNum(t.debit)}
                    </span>
                  ) : t.credit ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold font-mono text-success tabular-nums">
                      <ArrowUp className="w-3 h-3" />
                      {fmtNum(t.credit)}
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-text-muted">—</span>
                  )}
                  {onRemove && (
                    <button
                      onClick={() => handleRemoveClick(i)}
                      className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-muted rounded-lg transition-colors"
                      aria-label="Remove transaction"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-base border-b border-border">
              {["#", "Date", "Description", `Debit (${currency})`, `Credit (${currency})`].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-[11px] font-semibold font-mono text-text-muted uppercase tracking-widest ${
                    i >= 3 ? "text-right" : "text-left"
                  }`}
                >
                  {h}
                </th>
              ))}
              {onRemove && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <motion.tbody
            className="divide-y divide-border"
            variants={skipAnimation ? undefined : staggerContainer}
            initial={skipAnimation ? false : "initial"}
            animate={skipAnimation ? false : "animate"}
          >
            {transactions.map((t, i) => (
              <motion.tr
                key={i}
                variants={skipAnimation ? undefined : tableRow}
                className={`transition-colors duration-100 ${
                  confirmState?.index === i ? "bg-danger-muted" : "hover:bg-elevated"
                }`}
              >
                {confirmState?.index === i ? (
                  <td colSpan={onRemove ? 6 : 5} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-text-secondary">
                        Remove{" "}
                        <span className="font-medium text-text-primary">
                          {t.description || "this transaction"}
                        </span>
                        ?
                      </p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleConfirm(t)}
                          className="px-3 py-1 text-xs font-semibold text-white bg-danger hover:bg-danger/80 rounded-md transition-colors"
                        >
                          Remove
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-3 py-1 text-xs font-semibold text-text-secondary bg-elevated hover:bg-overlay rounded-md transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </td>
                ) : (
                  <>
                    <td className="px-4 py-3 text-xs font-mono text-text-muted tabular-nums w-10">{i + 1}</td>
                    <td className="px-4 py-3 text-xs font-mono text-text-secondary whitespace-nowrap tabular-nums">
                      {formatDate(t.transaction_date)}
                    </td>
                    <td className="px-4 py-3 text-text-primary max-w-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium">{t.description || "—"}</span>
                        {t.fx_currency && (
                          <span className="shrink-0 text-[10px] font-medium font-mono text-accent bg-accent-muted border border-accent/20 px-1.5 py-0.5 rounded-full">
                            {t.fx_currency}
                            {t.fx_amount ? ` ${fmtNum(t.fx_amount)}` : ""}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {t.debit ? (
                        <span className="inline-flex items-center gap-1 font-semibold font-mono text-danger tabular-nums text-sm">
                          <ArrowDown className="w-3 h-3" />
                          {fmtNum(t.debit)}
                        </span>
                      ) : (
                        <span className="font-mono text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {t.credit ? (
                        <span className="inline-flex items-center gap-1 font-semibold font-mono text-success tabular-nums text-sm">
                          <ArrowUp className="w-3 h-3" />
                          {fmtNum(t.credit)}
                        </span>
                      ) : (
                        <span className="font-mono text-text-muted">—</span>
                      )}
                    </td>
                    {onRemove && (
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleRemoveClick(i)}
                          className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-muted rounded-lg transition-colors"
                          aria-label="Remove transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </>
                )}
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </div>
    </>
  );
}

function OriginalView({
  headers,
  rows,
  onRemove,
}: {
  headers: string[];
  rows: string[][];
  onRemove?: (index: number) => void;
}) {
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const colCount = headers.length + (onRemove ? 2 : 1); // # col + headers + optional delete

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-base border-b border-border">
            <th className="px-4 py-3 text-[11px] font-semibold font-mono text-text-muted uppercase tracking-widest text-left w-10">
              #
            </th>
            {headers.map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-[11px] font-semibold font-mono text-text-muted uppercase tracking-widest text-left whitespace-nowrap"
              >
                {h}
              </th>
            ))}
            {onRemove && <th className="px-4 py-3 w-10" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, i) => (
            <tr
              key={i}
              className={`transition-colors duration-100 ${
                confirmState?.index === i ? "bg-danger-muted" : "hover:bg-elevated"
              }`}
            >
              {confirmState?.index === i ? (
                <td colSpan={colCount} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-text-secondary">Remove this transaction?</p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => { onRemove?.(i); setConfirmState(null); }}
                        className="px-3 py-1 text-xs font-semibold text-white bg-danger hover:bg-danger/80 rounded-md transition-colors"
                      >
                        Remove
                      </button>
                      <button
                        onClick={() => setConfirmState(null)}
                        className="px-3 py-1 text-xs font-semibold text-text-secondary bg-elevated hover:bg-overlay rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </td>
              ) : (
                <>
                  <td className="px-4 py-3 text-xs font-mono text-text-muted tabular-nums">{i + 1}</td>
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-4 py-3 text-sm text-text-primary whitespace-nowrap max-w-xs truncate">
                      {cell || "—"}
                    </td>
                  ))}
                  {onRemove && (
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setConfirmState({ index: i })}
                        className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-muted rounded-lg transition-colors"
                        aria-label="Remove transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SpreadsheetView({
  transactions, currency, originalHeaders, rawRows,
}: {
  transactions: Transaction[];
  currency: string;
  originalHeaders?: string[];
  rawRows?: string[][];
}) {
  const hasOriginal = !!(originalHeaders?.length && rawRows?.length);

  if (hasOriginal) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono border-collapse">
          <thead>
            <tr className="bg-base">
              <th className="border border-border px-2 py-2 text-[10px] font-semibold text-text-muted uppercase tracking-widest text-left w-8">#</th>
              {originalHeaders!.map((h) => (
                <th key={h} className="border border-border px-2 py-2 text-[10px] font-semibold text-text-muted uppercase tracking-widest text-left whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rawRows!.map((row, i) => (
              <tr key={i} className={`hover:bg-elevated transition-colors ${i % 2 === 0 ? "bg-surface" : "bg-base/60"}`}>
                <td className="border border-border/50 px-2 py-1.5 text-text-muted tabular-nums text-right select-all">{i + 1}</td>
                {row.map((cell, ci) => (
                  <td key={ci} className="border border-border/50 px-2 py-1.5 text-text-primary whitespace-nowrap select-all">
                    {cell || ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const hasFx = transactions.some(t => t.fx_currency);
  const headers = [
    "#", "Date", "Description",
    `Debit (${currency})`, `Credit (${currency})`,
    ...(hasFx ? ["FX Currency", "FX Amount"] : []),
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono border-collapse">
        <thead>
          <tr className="bg-base">
            {headers.map((h, i) => (
              <th
                key={h}
                className={`border border-border px-2 py-2 text-[10px] font-semibold text-text-muted uppercase tracking-widest whitespace-nowrap ${
                  i >= 3 ? "text-right" : "text-left"
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {transactions.map((t, i) => (
            <tr key={i} className={`hover:bg-elevated transition-colors ${i % 2 === 0 ? "bg-surface" : "bg-base/60"}`}>
              <td className="border border-border/50 px-2 py-1.5 text-text-muted tabular-nums text-right w-8 select-all">{i + 1}</td>
              <td className="border border-border/50 px-2 py-1.5 text-text-secondary whitespace-nowrap select-all">
                {t.transaction_date ? String(t.transaction_date) : ""}
              </td>
              <td className="border border-border/50 px-2 py-1.5 text-text-primary select-all">{t.description || ""}</td>
              <td className="border border-border/50 px-2 py-1.5 text-right tabular-nums select-all">
                {t.debit ? <span className="text-danger">{Number(t.debit).toFixed(2)}</span> : ""}
              </td>
              <td className="border border-border/50 px-2 py-1.5 text-right tabular-nums select-all">
                {t.credit ? <span className="text-success">{Number(t.credit).toFixed(2)}</span> : ""}
              </td>
              {hasFx && (
                <>
                  <td className="border border-border/50 px-2 py-1.5 text-accent select-all">{t.fx_currency || ""}</td>
                  <td className="border border-border/50 px-2 py-1.5 text-right tabular-nums select-all">
                    {t.fx_amount ? Number(t.fx_amount).toFixed(2) : ""}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
