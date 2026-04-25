"use client";

import React, { useEffect, useState } from "react";
import {
  ParsedData,
  ParsedDataWithId,
  Transaction,
} from "@/features/dashboard/types";
import SummaryCard from "@/features/dashboard/SummaryCard";
import FilterCard from "@/features/dashboard/FilterCard";
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
import { motion } from "framer-motion";
import { pageVariants } from "@/lib/motion";

type Props = {
  id?: string;
};

export default function Dashboard(props: Props) {
  const router = useRouter();
  const { parsedList, deleteParsed, updateParsed, loading } = useParsedStorage();

  const [parsedData, setParsedData] = useState<ParsedDataWithId | null>(null);
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
      router.replace(`/view-parsed/${parsedList[parsedList.length - 1].id}`);
    }
    if (parsed) {
      setParsedData(parsed ?? null);
    }
  }, [parsed, parsedList, id]);

  const { bank, summary } = parsedData || {
    bank: "",
    summary: {
      record_count: 0,
      total_debit: 0,
      total_credit: 0,
      net_change: 0,
    },
  };

  const handleSelectParsed = (id: string) => router.push(`/view-parsed/${id}`);
  const handleDelete = (id: string) => deleteParsed(id);

  const handleRemoveTransaction = (tx: Transaction) => {
    setPendingTx(tx);
    setConfirmOpen(true);
  };

  const confirmRemove = async () => {
    if (!parsedData || !pendingTx) return;
    const tx = pendingTx;

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

    const nextTransactions = parsedData.transactions.filter((_, i) => i !== index);
    const totals = nextTransactions.reduce(
      (acc, t) => {
        acc.debit += Number(t.debit || 0);
        acc.credit += Number(t.credit || 0);
        return acc;
      },
      { debit: 0, credit: 0 }
    );

    const updated = await updateParsed(parsedData.id, {
      transactions: nextTransactions,
      summary: {
        record_count: nextTransactions.length,
        total_debit: totals.debit,
        total_credit: totals.credit,
        net_change: totals.credit - totals.debit,
      },
    });
    if (updated) setParsedData(updated);

    setConfirmOpen(false);
    setPendingTx(null);
  };

  const handleSaveToCloud = async () => {
    // Implemented via SaveToCloudButton in ViewParsed
  };

  return (
    <motion.div
      className="min-h-screen bg-base py-8 px-4 sm:px-6 lg:px-8"
      variants={pageVariants}
      initial="initial"
      animate="animate"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-surface border border-border rounded-2xl shadow-surface p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Left */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={() => router.push("/upload")}
                    className="flex items-center justify-center w-9 h-9 rounded-lg bg-elevated hover:bg-overlay text-text-secondary hover:text-text-primary transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="w-9 h-9 rounded-xl bg-accent-muted ring-1 ring-accent/20 flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-accent" />
                  </div>
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary tracking-tight mb-2 leading-tight">
                  {bank || "Statement"}
                </h1>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold font-mono bg-accent-muted text-accent border border-accent/20">
                    Dashboard
                  </span>
                  <span className="text-xs font-mono text-text-muted">
                    {summary.record_count} transactions
                  </span>
                </div>
              </div>

              {/* Action Buttons — Desktop */}
              <div className="hidden md:flex flex-col md:flex-row gap-3">
                <button
                  onClick={handleSaveToCloud}
                  disabled={saving || !parsedData}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-150 bg-success/10 border border-success/30 text-success hover:bg-success/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <CloudUpload className="w-4 h-4" />
                  {saving ? "Saving..." : "Save to Cloud"}
                </button>

                <button
                  onClick={() => router.push("/upload")}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-150 bg-accent-muted border border-accent/20 text-accent hover:bg-accent-muted/80"
                >
                  <Upload className="w-4 h-4" />
                  Upload Another
                </button>

                <button
                  onClick={() => router.push("/statements")}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-150 bg-elevated border border-border text-text-secondary hover:bg-overlay hover:text-text-primary"
                >
                  <ClipboardList className="w-4 h-4" />
                  Saved Statements
                </button>
              </div>

              {/* Action Buttons — Mobile */}
              <div className="flex md:hidden items-center gap-2">
                <button
                  onClick={handleSaveToCloud}
                  disabled={saving || !parsedData}
                  title="Save to Cloud"
                  className="w-10 h-10 rounded-xl flex items-center justify-center bg-success/10 border border-success/30 text-success hover:bg-success/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  <CloudUpload className="w-4 h-4" />
                </button>
                <button
                  onClick={() => router.push("/upload")}
                  title="Upload Another"
                  className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent-muted border border-accent/20 text-accent hover:bg-accent-muted/80 transition-all"
                >
                  <Upload className="w-4 h-4" />
                </button>
                <button
                  onClick={() => router.push("/statements")}
                  title="Saved Statements"
                  className="w-10 h-10 rounded-xl flex items-center justify-center bg-elevated border border-border text-text-secondary hover:bg-overlay transition-all"
                >
                  <ClipboardList className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
          <SummaryCard
            title="Total Transactions"
            value={summary.record_count}
            icon={<ListOrdered className="text-accent w-5 h-5" />}
          />
          <SummaryCard
            title="Total Debit"
            value={`AED ${summary.total_debit.toFixed(2)}`}
            icon={<TrendingDown className="text-danger w-5 h-5" />}
            highlight="red"
          />
          <SummaryCard
            title="Total Credit"
            value={`AED ${summary.total_credit.toFixed(2)}`}
            icon={<TrendingUp className="text-success w-5 h-5" />}
            highlight="green"
          />
          <SummaryCard
            title="Net Change"
            value={`AED ${summary.net_change.toFixed(2)}`}
            icon={<Wallet className="text-accent w-5 h-5" />}
            highlight={summary.net_change < 0 ? "red" : "green"}
          />
        </div>

        {/* Filter Card */}
        <FilterCard
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
        />

        <ConfirmModal
          open={confirmOpen}
          title="Remove Transaction"
          description="Are you sure you want to remove this transaction? This will update your totals."
          confirmText="Remove"
          cancelText="Cancel"
          onConfirm={confirmRemove}
          onCancel={() => {
            setConfirmOpen(false);
            setPendingTx(null);
          }}
        />

        <ParsedList
          parsedList={parsedList}
          onSelect={handleSelectParsed}
          onDelete={handleDelete}
        />
      </div>
    </motion.div>
  );
}
