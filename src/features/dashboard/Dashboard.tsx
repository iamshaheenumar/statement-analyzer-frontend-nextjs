"use client";

import React, { useEffect, useState } from "react";
import {
  ParsedData,
  ParsedDataWithId,
  Transaction,
} from "@/features/dashboard/types";
import SummaryCard from "@/features/dashboard/SummaryCard";
import FilterCard from "@/features/dashboard/FilterCard";
import TransactionsTable from "@/features/dashboard/TransactionsTable";
import ParsedList from "@/features/dashboard/ParsedList";
import { useParsedStorage } from "@/features/dashboard/useParsedStorage";
import ConfirmModal from "@/features/dashboard/ConfirmModal";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ListOrdered,
  CloudUpload,
  ArrowLeft,
  Upload,
  ClipboardList,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { parseISO } from "date-fns";
import { toast } from "sonner";

type Props = {
  id?: string;
};

export default function Dashboard(props: Props) {
  const router = useRouter();
  const { parsedList, deleteParsed, updateParsed, loading } =
    useParsedStorage();

  const [parsedData, setParsedData] = useState<ParsedDataWithId | null>(null);
  const [filtered, setFiltered] = useState<ParsedData["transactions"]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingTx, setPendingTx] = useState<Transaction | null>(null);
  const [saving, setSaving] = useState(false);

  const id = props?.id;
  const parsed = parsedList.find((p) => p.id === id);

  useEffect(() => {
    if (!parsed && parsedList.length > 0 && !id) {
      // if no specific ID, load latest
      router.replace(`/view-parsed?id=${parsedList[parsedList.length - 1].id}`);
    }

    if (parsed) {
      setParsedData(parsed ?? null);
      setFiltered(parsed?.transactions);
    }
  }, [parsed, parsedList, id]);

  // Apply search + date filters
  useEffect(() => {
    if (!parsedData) return;

    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;

    const filteredTxns = parsedData.transactions.filter((t) => {
      const dateObj = parseISO(t.transaction_date);
      const matchesText = t.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const inRange =
        (!from || (dateObj && dateObj >= from)) &&
        (!to || (dateObj && dateObj <= to));
      return matchesText && inRange;
    });

    setFiltered(filteredTxns);
  }, [searchTerm, dateFrom, dateTo, parsedData]);

  const { bank, summary } = parsedData || {
    bank: "",
    summary: {
      record_count: 0,
      total_debit: 0,
      total_credit: 0,
      net_change: 0,
    },
  };

  const handleSelectParsed = (id: string) => {
    router.push(`/view-parsed?id=${id}`);
  };

  const handleDelete = (id: string) => deleteParsed(id);

  const handleRemoveTransaction = (tx: Transaction) => {
    setPendingTx(tx);
    setConfirmOpen(true);
  };

  const confirmRemove = async () => {
    if (!parsedData || !pendingTx) return;
    const tx = pendingTx;

    // Try to find by reference first
    let index = parsedData.transactions.indexOf(tx);
    if (index === -1) {
      index = parsedData.transactions.findIndex(
        (t) =>
          t.transaction_date === tx.transaction_date &&
          t.description === tx.description &&
          t.debit === tx.debit &&
          t.credit === tx.credit &&
          t.amount === tx.amount &&
          t.bank === tx.bank
      );
    }

    if (index === -1) {
      setConfirmOpen(false);
      setPendingTx(null);
      return;
    }

    const nextTransactions = parsedData.transactions.filter(
      (_, i) => i !== index
    );
    const totals = nextTransactions.reduce(
      (acc, t) => {
        acc.debit += Number(t.debit || 0);
        acc.credit += Number(t.credit || 0);
        return acc;
      },
      { debit: 0, credit: 0 }
    );
    const nextSummary = {
      record_count: nextTransactions.length,
      total_debit: totals.debit,
      total_credit: totals.credit,
      net_change: totals.credit - totals.debit,
    };

    const updated = await updateParsed(parsedData.id, {
      transactions: nextTransactions,
      summary: nextSummary,
    });
    if (updated) setParsedData(updated);

    setConfirmOpen(false);
    setPendingTx(null);
  };

  const handleSaveToCloud = async () => {
    if (!parsedData || saving) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedData),
      });
      let data: any = null;
      try {
        data = await res.json();
      } catch {}
      if (!res.ok || (data && data.error)) {
        const msg = data?.error || `Save failed (${res.status})`;
        throw new Error(msg);
      }
      toast.success("Saved to cloud successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to save to cloud");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          {/* Glass Card Header */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Left Side - Title Section */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={() => router.push("/upload")}
                    className="group flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all hover:scale-110 hover:shadow-md"
                  >
                    <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
                  </button>

                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 mb-2 leading-tight">
                  {bank}
                </h1>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
                    Statement Dashboard
                  </span>
                  <span className="text-xs sm:text-sm text-gray-500">
                    {summary.record_count} transactions
                  </span>
                </div>
              </div>

              {/* Right Side - Action Buttons */}
              {/* Desktop and up: full buttons with labels */}
              <div className="hidden md:flex flex-col md:flex-row gap-3">
                <button
                  onClick={handleSaveToCloud}
                  disabled={saving || !parsedData}
                  aria-busy={saving}
                  className="group relative overflow-hidden px-6 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-2xl font-semibold shadow-lg shadow-green-500/30 transition-all hover:shadow-2xl hover:shadow-green-500/50 hover:scale-105 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <span className="relative flex items-center justify-center gap-2">
                    <CloudUpload
                      className={`w-5 h-5 transition-transform ${
                        saving
                          ? "animate-bounce"
                          : "group-hover:-translate-y-1 group-hover:scale-110"
                      }`}
                    />
                    {saving ? "Saving..." : "Save to Cloud"}
                  </span>
                </button>

                <button
                  onClick={() => router.push("/upload")}
                  className="group relative overflow-hidden px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-semibold shadow-lg shadow-blue-500/30 transition-all hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-105"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <span className="relative flex items-center justify-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload Another
                  </span>
                </button>

                <button
                  onClick={() => router.push("/statements")}
                  className="group relative overflow-hidden px-6 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl font-semibold shadow-lg shadow-purple-500/30 transition-all hover:shadow-2xl hover:shadow-purple-500/50 hover:scale-105"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <span className="relative flex items-center justify-center gap-2">
                    <ClipboardList className="w-5 h-5" />
                    Saved Statements
                  </span>
                </button>
              </div>

              {/* Mobile: compact icon-only buttons */}
              <div className="flex md:hidden items-center gap-2 sm:gap-3">
                <button
                  onClick={handleSaveToCloud}
                  disabled={saving || !parsedData}
                  aria-busy={saving}
                  title="Save to Cloud"
                  className="group relative overflow-hidden w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-full shadow-lg shadow-green-500/30 transition-all hover:shadow-2xl hover:shadow-green-500/50 hover:scale-105 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-full"></div>
                  <CloudUpload
                    className={`w-5 h-5 relative ${
                      saving
                        ? "animate-bounce"
                        : "group-hover:-translate-y-0.5 group-hover:scale-110"
                    }`}
                  />
                </button>

                <button
                  onClick={() => router.push("/upload")}
                  title="Upload Another"
                  className="group relative overflow-hidden w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-lg shadow-blue-500/30 transition-all hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-105 flex items-center justify-center"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-full"></div>
                  <Upload className="w-5 h-5 relative" />
                </button>

                <button
                  onClick={() => router.push("/statements")}
                  title="Saved Statements"
                  className="group relative overflow-hidden w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full shadow-lg shadow-purple-500/30 transition-all hover:shadow-2xl hover:shadow-purple-500/50 hover:scale-105 flex items-center justify-center"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-full"></div>
                  <ClipboardList className="w-5 h-5 relative" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <SummaryCard
            title="Total Transactions"
            value={summary.record_count}
            icon={<ListOrdered className="text-blue-600 w-6 h-6" />}
          />
          <SummaryCard
            title="Total Debit"
            value={`AED ${summary.total_debit.toFixed(2)}`}
            icon={<TrendingDown className="text-red-600 w-6 h-6" />}
          />
          <SummaryCard
            title="Total Credit"
            value={`AED ${summary.total_credit.toFixed(2)}`}
            icon={<TrendingUp className="text-green-600 w-6 h-6" />}
          />
          <SummaryCard
            title="Net Change"
            value={`AED ${summary.net_change.toFixed(2)}`}
            icon={<Wallet className="text-purple-600 w-6 h-6" />}
            highlight={summary.net_change < 0 ? "red" : "green"}
          />
        </div>

        {/* Search & Filter Card */}
        <FilterCard
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
        />

        {/* Transactions Table */}
        <TransactionsTable
          transactions={filtered}
          onRemove={handleRemoveTransaction}
          searchTerm={searchTerm}
          dateFrom={dateFrom}
          dateTo={dateTo}
        />

        <ConfirmModal
          open={confirmOpen}
          title="Remove Transaction"
          description="Are you sure you want to remove this transaction from the table? This will update your totals."
          confirmText="Remove"
          cancelText="Cancel"
          onConfirm={confirmRemove}
          onCancel={() => {
            setConfirmOpen(false);
            setPendingTx(null);
          }}
        />

        {/* Recent Parsed Statements */}
        <ParsedList
          parsedList={parsedList}
          onSelect={handleSelectParsed}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
