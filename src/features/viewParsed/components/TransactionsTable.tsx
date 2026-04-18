"use client";

import { useState } from "react";
import { Transaction } from "@/features/dashboard/types";
import { formatDate } from "@/utils/date";
import {
  FileText, ArrowDown, ArrowUp, Trash2,
  Download, Copy, Table2, LayoutList, Check,
} from "lucide-react";
import { toast } from "sonner";

type ViewMode = "normal" | "spreadsheet";

type Props = {
  transactions: Transaction[];
  onRemove?: (tx: Transaction) => void;
  searchTerm?: string;
  bank?: string;
  fromDate?: string;
  toDate?: string;
  currency?: string;
};

type ConfirmState = { index: number } | null;

const fmtNum = (n: number | string) =>
  Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function buildCSVFilename(bank?: string, from?: string, to?: string) {
  const parts = [bank || "statement", from, to].filter(Boolean);
  return parts.join("_").replace(/\s+/g, "-") + ".csv";
}

function downloadCSV(transactions: Transaction[], currency: string, bank?: string, from?: string, to?: string) {
  const headers = ["Date", "Description", `Debit (${currency})`, `Credit (${currency})`, "FX Currency", "FX Amount"];
  const rows = transactions.map((t) => [
    t.transaction_date || "",
    `"${(t.description || "").replace(/"/g, '""')}"`,
    t.debit ? Number(t.debit).toFixed(2) : "",
    t.credit ? Number(t.credit).toFixed(2) : "",
    t.fx_currency || "",
    t.fx_amount ? Number(t.fx_amount).toFixed(2) : "",
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  // BOM prefix so Excel opens UTF-8 correctly
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = buildCSVFilename(bank, from, to);
  a.click();
  URL.revokeObjectURL(url);
}

async function copyAsTSV(transactions: Transaction[], currency: string) {
  const headers = ["Date", "Description", `Debit (${currency})`, `Credit (${currency})`, "FX Currency", "FX Amount"];
  const rows = transactions.map((t) => [
    t.transaction_date || "",
    t.description || "",
    t.debit ? Number(t.debit).toFixed(2) : "",
    t.credit ? Number(t.credit).toFixed(2) : "",
    t.fx_currency || "",
    t.fx_amount ? Number(t.fx_amount).toFixed(2) : "",
  ]);
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
}: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("normal");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await copyAsTSV(transactions, currency);
      setCopied(true);
      toast.success("Copied — paste directly into Excel or Google Sheets");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleDownload = () => {
    downloadCSV(transactions, currency, bank, fromDate, toDate);
    toast.success("CSV downloaded");
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm font-semibold text-slate-800">
          Transactions
          <span className="ml-2 text-xs font-normal text-slate-400">
            {transactions.length} {searchTerm?.trim() ? "filtered" : "total"}
          </span>
        </p>

        {transactions.length > 0 && (
          <div className="flex items-center gap-1.5">
            {/* View toggle */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("normal")}
                title="Normal view"
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "normal"
                    ? "bg-white text-slate-700 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("spreadsheet")}
                title="Spreadsheet view"
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "spreadsheet"
                    ? "bg-white text-slate-700 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <Table2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Copy for Excel */}
            <button
              onClick={handleCopy}
              title="Copy for Excel / Google Sheets"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{copied ? "Copied!" : "Copy"}</span>
            </button>

            {/* Download CSV */}
            <button
              onClick={handleDownload}
              title="Download as CSV"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </button>
          </div>
        )}
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-slate-400">
          <FileText className="w-8 h-8 mb-2" />
          <p className="text-sm">No transactions found</p>
        </div>
      ) : viewMode === "spreadsheet" ? (
        <SpreadsheetView transactions={transactions} currency={currency} />
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

  const handleRemoveClick = (i: number) => setConfirmState({ index: i });
  const handleConfirm = (t: Transaction) => { onRemove?.(t); setConfirmState(null); };
  const handleCancel = () => setConfirmState(null);

  return (
    <>
      {/* Mobile cards */}
      <ul className="divide-y divide-slate-100 md:hidden">
        {transactions.map((t, i) => (
          <li key={i} className="px-4 py-3">
            {confirmState?.index === i ? (
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-slate-500">Remove this transaction?</p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleConfirm(t)}
                    className="px-2.5 py-1 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors"
                  >
                    Remove
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 truncate">{t.description || "—"}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-xs text-slate-400">{formatDate(t.transaction_date)}</p>
                    {t.fx_currency && (
                      <span className="text-[10px] font-medium text-blue-500 bg-blue-50 px-1 py-0.5 rounded">
                        {t.fx_currency}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {t.debit ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                      <ArrowDown className="w-3 h-3" />
                      {fmtNum(t.debit)}
                    </span>
                  ) : t.credit ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
                      <ArrowUp className="w-3 h-3" />
                      {fmtNum(t.credit)}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                  {onRemove && (
                    <button
                      onClick={() => handleRemoveClick(i)}
                      className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
            <tr className="bg-slate-50 border-b border-slate-100">
              {["#", "Date", "Description", `Debit (${currency})`, `Credit (${currency})`].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide ${
                    i >= 3 ? "text-right" : "text-left"
                  }`}
                >
                  {h}
                </th>
              ))}
              {onRemove && <th className="px-4 py-2.5" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((t, i) => (
              <tr key={i} className={`transition-colors ${confirmState?.index === i ? "bg-red-50" : "hover:bg-slate-50"}`}>
                {confirmState?.index === i ? (
                  <td colSpan={onRemove ? 6 : 5} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-slate-600">
                        Remove <span className="font-medium">{t.description || "this transaction"}</span>?
                      </p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleConfirm(t)}
                          className="px-3 py-1 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors"
                        >
                          Remove
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-3 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </td>
                ) : (
                  <>
                    <td className="px-4 py-3 text-xs text-slate-400 tabular-nums">{i + 1}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {formatDate(t.transaction_date)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800 max-w-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{t.description || "—"}</span>
                        {t.fx_currency && (
                          <span className="shrink-0 text-[10px] font-medium text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-full">
                            {t.fx_currency}
                            {t.fx_amount ? ` ${fmtNum(t.fx_amount)}` : ""}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {t.debit ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-red-600 tabular-nums">
                          <ArrowDown className="w-3 h-3" />
                          {fmtNum(t.debit)}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {t.credit ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-green-600 tabular-nums">
                          <ArrowUp className="w-3 h-3" />
                          {fmtNum(t.credit)}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    {onRemove && (
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleRemoveClick(i)}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
    </>
  );
}

function SpreadsheetView({ transactions, currency }: { transactions: Transaction[]; currency: string }) {
  const hasFx = transactions.some(t => t.fx_currency);
  const headers = ["#", "Date", "Description", `Debit (${currency})`, `Credit (${currency})`,
    ...(hasFx ? ["FX Currency", "FX Amount"] : [])];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono border-collapse">
        <thead>
          <tr className="bg-slate-100">
            {headers.map((h, i) => (
              <th
                key={h}
                className={`border border-slate-200 px-2 py-1.5 font-semibold text-slate-600 bg-slate-100 whitespace-nowrap ${
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
            <tr
              key={i}
              className={i % 2 === 0 ? "bg-white" : "bg-slate-50/60"}
            >
              <td className="border border-slate-200 px-2 py-1 text-slate-400 tabular-nums text-right w-8 select-all">
                {i + 1}
              </td>
              <td className="border border-slate-200 px-2 py-1 text-slate-600 whitespace-nowrap select-all">
                {t.transaction_date ? String(t.transaction_date) : ""}
              </td>
              <td className="border border-slate-200 px-2 py-1 text-slate-800 select-all">
                {t.description || ""}
              </td>
              <td className="border border-slate-200 px-2 py-1 text-right tabular-nums select-all">
                {t.debit ? (
                  <span className="text-red-600">{Number(t.debit).toFixed(2)}</span>
                ) : ""}
              </td>
              <td className="border border-slate-200 px-2 py-1 text-right tabular-nums select-all">
                {t.credit ? (
                  <span className="text-green-600">{Number(t.credit).toFixed(2)}</span>
                ) : ""}
              </td>
              {hasFx && (
                <>
                  <td className="border border-slate-200 px-2 py-1 text-slate-500 select-all">
                    {t.fx_currency || ""}
                  </td>
                  <td className="border border-slate-200 px-2 py-1 text-right tabular-nums select-all">
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
