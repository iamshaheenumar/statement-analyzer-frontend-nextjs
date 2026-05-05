"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, FileText, Download, Copy, Check, Tag, Table2, Sheet } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/utils/date";
import { updateTransactionCategoryAction } from "@/app/actions/categories";

type CategoryOption = { id: string; name: string; color: string };

type SavedTransaction = {
  id: number;
  transaction_date: Date | null;
  description: string | null;
  debit: number | null;
  credit: number | null;
  amount: number | null;
  bank: string | null;
  categoryId: string | null;
  category: CategoryOption | null;
};

type Props = {
  transactions: SavedTransaction[];
  allCategories: CategoryOption[];
  currency?: string;
};

const fmtNum = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function downloadCSV(transactions: SavedTransaction[], currency: string) {
  const headers = ["Date", "Description", "Category", `Debit (${currency})`, `Credit (${currency})`];
  const rows = transactions.map((t) => [
    t.transaction_date ? new Date(t.transaction_date).toISOString().split("T")[0] : "",
    `"${(t.description || "").replace(/"/g, '""')}"`,
    `"${(t.category?.name || "").replace(/"/g, '""')}"`,
    t.debit ? t.debit.toFixed(2) : "",
    t.credit ? t.credit.toFixed(2) : "",
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "transactions.csv";
  a.click();
  URL.revokeObjectURL(url);
}

async function copyAsTSV(transactions: SavedTransaction[], currency: string) {
  const headers = ["Date", "Description", "Category", `Debit (${currency})`, `Credit (${currency})`];
  const rows = transactions.map((t) => [
    t.transaction_date ? new Date(t.transaction_date).toISOString().split("T")[0] : "",
    t.description || "",
    t.category?.name || "",
    t.debit ? t.debit.toFixed(2) : "",
    t.credit ? t.credit.toFixed(2) : "",
  ]);
  const tsv = [headers, ...rows].map((r) => r.join("\t")).join("\n");
  await navigator.clipboard.writeText(tsv);
}

function CategoryBadge({ category }: { category: CategoryOption | null }) {
  if (!category) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-elevated text-text-muted border border-border">
        <Tag className="w-2.5 h-2.5" />
        Uncategorized
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border"
      style={{
        backgroundColor: category.color + "20",
        borderColor: category.color + "40",
        color: category.color,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: category.color }}
      />
      {category.name}
    </span>
  );
}

function CategorySelect({
  transactionId,
  currentCategoryId,
  allCategories,
  onUpdate,
}: {
  transactionId: number;
  currentCategoryId: string | null;
  allCategories: CategoryOption[];
  onUpdate: (categoryId: string, category: CategoryOption) => void;
}) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = e.target.value;
    const category = allCategories.find((c) => c.id === categoryId);
    if (!category) return;

    startTransition(async () => {
      const result = await updateTransactionCategoryAction(transactionId, categoryId);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        onUpdate(categoryId, category);
        toast.success("Category updated");
      }
    });
  };

  return (
    <select
      value={currentCategoryId || ""}
      onChange={handleChange}
      disabled={isPending}
      className="text-[11px] font-medium bg-transparent border border-border rounded-lg px-2 py-1 text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent cursor-pointer disabled:opacity-50"
    >
      <option value="">Uncategorized</option>
      {allCategories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}

export default function TransactionsTable({
  transactions: initialTransactions,
  allCategories,
  currency = "AED",
}: Props) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "spreadsheet">("table");

  const handleCategoryUpdate = (txId: number, categoryId: string, category: CategoryOption) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === txId ? { ...t, categoryId, category } : t))
    );
  };

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
    downloadCSV(transactions, currency);
    toast.success("CSV downloaded");
  };

  return (
    <div className="bg-surface border border-border rounded-2xl shadow-surface overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-5 py-3.5 border-b border-border flex items-center justify-between gap-3 flex-wrap">
        <p className="font-display text-sm font-semibold text-text-primary">
          Transactions
          <span className="ml-2 text-xs font-normal font-mono text-text-muted">
            {transactions.length} total
          </span>
        </p>
        <div className="flex items-center gap-1.5">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setViewMode("table")}
              title="Table view"
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors ${
                viewMode === "table"
                  ? "bg-elevated text-text-primary"
                  : "text-text-muted hover:text-text-secondary hover:bg-elevated/50"
              }`}
            >
              <Table2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode("spreadsheet")}
              title="Spreadsheet view"
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors border-l border-border ${
                viewMode === "spreadsheet"
                  ? "bg-elevated text-text-primary"
                  : "text-text-muted hover:text-text-secondary hover:bg-elevated/50"
              }`}
            >
              <Sheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sheet</span>
            </button>
          </div>

          {transactions.length > 0 && (
            <>
              <button
                onClick={handleCopy}
                title="Copy for Excel / Google Sheets"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  copied
                    ? "text-success bg-success-muted"
                    : "text-text-secondary hover:text-text-primary hover:bg-elevated"
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? "Copied!" : "Copy"}</span>
              </button>
              <button
                onClick={handleDownload}
                title="Download as CSV"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-elevated rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">CSV</span>
              </button>
            </>
          )}
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14">
          <FileText className="w-8 h-8 mb-2 text-text-muted" />
          <p className="text-sm text-text-muted">No transactions found</p>
        </div>
      ) : viewMode === "spreadsheet" ? (
        /* Spreadsheet view — dense grid, all screen sizes */
        <div className="overflow-auto max-h-[600px]">
          <table className="w-full text-xs font-mono border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-base">
                <th className="border border-border px-2 py-1.5 w-8 bg-base" />
                {["Date", "Description", "Category", `Debit (${currency})`, `Credit (${currency})`].map(
                  (h, i) => (
                    <th
                      key={h}
                      className={`border border-border px-2 py-1.5 font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap text-[10px] ${
                        i >= 3 ? "text-right" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, i) => (
                <tr
                  key={t.id}
                  className={`hover:bg-accent/5 transition-colors duration-75 ${
                    i % 2 === 0 ? "bg-surface" : "bg-base/50"
                  }`}
                >
                  {/* Row number gutter */}
                  <td className="border border-border px-2 py-1 text-[10px] text-text-muted text-center bg-base/80 select-none tabular-nums">
                    {i + 1}
                  </td>
                  <td className="border border-border px-2 py-1 text-text-secondary whitespace-nowrap tabular-nums">
                    {formatDate(t.transaction_date)}
                  </td>
                  <td className="border border-border px-2 py-1 text-text-primary max-w-[300px]">
                    <span className="truncate block">{t.description || "—"}</span>
                  </td>
                  <td className="border border-border px-1.5 py-0.5">
                    <CategorySelect
                      transactionId={t.id}
                      currentCategoryId={t.categoryId}
                      allCategories={allCategories}
                      onUpdate={(catId, cat) => handleCategoryUpdate(t.id, catId, cat)}
                    />
                  </td>
                  <td className="border border-border px-2 py-1 text-right tabular-nums">
                    {t.debit ? (
                      <span className="text-danger font-semibold">{fmtNum(t.debit)}</span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                  <td className="border border-border px-2 py-1 text-right tabular-nums">
                    {t.credit ? (
                      <span className="text-success font-semibold">{fmtNum(t.credit)}</span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <ul className="divide-y divide-border md:hidden">
            {transactions.map((t) => (
              <li key={t.id} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {t.description || "—"}
                    </p>
                    <p className="text-xs font-mono text-text-muted mt-0.5">
                      {formatDate(t.transaction_date)}
                    </p>
                    <div className="mt-1.5">
                      <CategorySelect
                        transactionId={t.id}
                        currentCategoryId={t.categoryId}
                        allCategories={allCategories}
                        onUpdate={(catId, cat) => handleCategoryUpdate(t.id, catId, cat)}
                      />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
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
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-base border-b border-border">
                  {["#", "Date", "Description", "Category", `Debit (${currency})`, `Credit (${currency})`].map(
                    (h, i) => (
                      <th
                        key={h}
                        className={`px-4 py-3 text-[11px] font-semibold font-mono text-text-muted uppercase tracking-widest ${
                          i >= 4 ? "text-right" : "text-left"
                        }`}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((t, i) => (
                  <tr key={t.id} className="hover:bg-elevated transition-colors duration-100">
                    <td className="px-4 py-3 text-xs font-mono text-text-muted tabular-nums w-10">
                      {i + 1}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-text-secondary whitespace-nowrap tabular-nums">
                      {formatDate(t.transaction_date)}
                    </td>
                    <td className="px-4 py-3 text-text-primary max-w-xs">
                      <span className="truncate text-sm font-medium block">
                        {t.description || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CategoryBadge category={t.category} />
                        <CategorySelect
                          transactionId={t.id}
                          currentCategoryId={t.categoryId}
                          allCategories={allCategories}
                          onUpdate={(catId, cat) => handleCategoryUpdate(t.id, catId, cat)}
                        />
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
