"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useParsedStorage } from "@/features/dashboard/useParsedStorage";
import type { ParsedDataWithId, Transaction } from "@/features/dashboard/types";
import TransactionsTable from "./components/TransactionsTable";
import SimpleSearch from "./components/SimpleSearch";
import ParsedHeader from "./components/ParsedHeader";
import ConfirmModal from "@/features/dashboard/ConfirmModal";

type Props = { id?: string };

export default function ViewParsed({ id }: Props) {
  const router = useRouter();
  const { parsedList, loading, updateParsed } = useParsedStorage();
  const [parsedData, setParsedData] = useState<ParsedDataWithId | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingTx, setPendingTx] = useState<Transaction | null>(null);

  const parsed = useMemo(() => parsedList.find((p) => p.id === id), [parsedList, id]);

  useEffect(() => {
    if (!loading) {
      if (!parsed && parsedList.length > 0 && !id) {
        router.replace(`/view-parsed?id=${parsedList[parsedList.length - 1].id}`);
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

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-4">
      <ParsedHeader
        bank={parsedData?.bank || ""}
        fromDate={parsedData?.from_date?.toString()}
        toDate={parsedData?.to_date?.toString()}
        cardType={parsedData?.card_type}
        parsedData={parsedData}
        onBack={() => router.back()}
      />

      <SimpleSearch value={searchTerm} onChange={setSearchTerm} />

      <TransactionsTable
        transactions={filtered}
        searchTerm={searchTerm}
        onRemove={handleRemoveTransaction}
      />

      <ConfirmModal
        open={confirmOpen}
        title="Remove Transaction"
        description="Remove this transaction? Totals will be recalculated."
        confirmText="Remove"
        cancelText="Cancel"
        onConfirm={confirmRemove}
        onCancel={() => {
          setConfirmOpen(false);
          setPendingTx(null);
        }}
      />
    </main>
  );
}
