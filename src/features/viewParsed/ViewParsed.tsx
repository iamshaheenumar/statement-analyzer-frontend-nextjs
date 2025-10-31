"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useParsedStorage } from "@/features/dashboard/useParsedStorage";
import type { ParsedDataWithId, Transaction } from "@/features/dashboard/types";
import TransactionsTable from "./components/TransactionsTable";
import SimpleSearch from "./components/SimpleSearch";
import ParsedHeader from "./components/ParsedHeader";
import ConfirmModal from "@/features/dashboard/ConfirmModal";
import SaveToCloudButton from "./components/SaveToCloudButton";

type Props = {
  id?: string;
};

export default function ViewParsed({ id }: Props) {
  const router = useRouter();
  const { parsedList, loading, updateParsed, deleteParsed } =
    useParsedStorage();
  const [parsedData, setParsedData] = useState<ParsedDataWithId | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingTx, setPendingTx] = useState<Transaction | null>(null);
  const [saving, setSaving] = useState(false);

  const parsed = useMemo(
    () => parsedList.find((p) => p.id === id),
    [parsedList, id]
  );

  useEffect(() => {
    if (!loading) {
      if (!parsed && parsedList.length > 0 && !id) {
        router.replace(
          `/view-parsed?id=${parsedList[parsedList.length - 1].id}`
        );
      }
      if (parsed) setParsedData(parsed);
    }
  }, [parsed, parsedList, id, loading, router]);

  const filtered = useMemo(() => {
    if (!parsedData) return [] as Transaction[];
    const term = searchTerm.trim().toLowerCase();
    if (!term) return parsedData.transactions;
    return parsedData.transactions.filter((t) =>
      (t.description || "").toLowerCase().includes(term)
    );
  }, [parsedData, searchTerm]);

  const bank = parsedData?.bank || "";

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <ParsedHeader
            bank={bank}
            fromDate={parsedData?.from_date}
            toDate={parsedData?.to_date}
            cardType={parsedData?.card_type}
            parsedData={parsedData}
            onBack={() => router.back()}
            saving={saving}
            onSavingChange={setSaving}
          />
        </div>

        {/* Simple search only */}
        <div className="mb-4">
          <SimpleSearch value={searchTerm} onChange={setSearchTerm} />
        </div>

        {/* Transactions at the top of viewport */}
        <TransactionsTable
          transactions={filtered}
          searchTerm={searchTerm}
          onRemove={handleRemoveTransaction}
        />

        {parsedData && (
          <div className="mt-6 flex justify-end">
            <SaveToCloudButton
              parsedData={parsedData}
              saving={saving}
              onSavingChange={setSaving}
              className="w-full sm:w-auto"
            />
          </div>
        )}

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
      </div>
    </div>
  );
}
