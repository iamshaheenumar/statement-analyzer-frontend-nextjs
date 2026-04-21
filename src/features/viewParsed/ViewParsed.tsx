"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useParsedStorage } from "@/features/dashboard/useParsedStorage";
import type { ParsedDataWithId, Transaction } from "@/features/dashboard/types";
import TransactionsTable from "./components/TransactionsTable";
import SimpleSearch from "./components/SimpleSearch";
import ParsedHeader from "./components/ParsedHeader";
import UnknownBankBanner from "./components/UnknownBankBanner";
import { motion } from "framer-motion";
import { pageVariants } from "@/lib/motion";

type Props = { id?: string };

export default function ViewParsed({ id }: Props) {
  const router = useRouter();
  const { parsedList, loading, updateParsed } = useParsedStorage();
  const [parsedData, setParsedData] = useState<ParsedDataWithId | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const parsed = useMemo(() => parsedList.find((p) => p.id === id), [parsedList, id]);

  useEffect(() => {
    if (!loading) {
      if (!parsed && parsedList.length > 0 && !id) {
        router.replace(`/view-parsed?id=${parsedList[parsedList.length - 1].id}`);
      }
      if (parsed) setParsedData(parsed);
    }
  }, [parsed, parsedList, id, loading, router]);

  const { filtered, filteredRawRows } = useMemo(() => {
    if (!parsedData) return { filtered: [] as Transaction[], filteredRawRows: [] as string[][] };
    const term = searchTerm.trim().toLowerCase();
    if (!term) return { filtered: parsedData.transactions, filteredRawRows: parsedData.rawRows ?? [] };

    const result: Transaction[] = [];
    const resultRawRows: string[][] = [];
    parsedData.transactions.forEach((t, i) => {
      const desc = (t.description || "").toLowerCase();
      const date = (t.transaction_date ? String(t.transaction_date) : "").toLowerCase();
      const debit = t.debit ? String(t.debit) : "";
      const credit = t.credit ? String(t.credit) : "";
      const rawMatch = parsedData.rawRows?.[i]?.some(v => v.toLowerCase().includes(term));
      if (desc.includes(term) || date.includes(term) || debit.includes(term) || credit.includes(term) || rawMatch) {
        result.push(t);
        if (parsedData.rawRows?.[i]) resultRawRows.push(parsedData.rawRows[i]);
      }
    });
    return { filtered: result, filteredRawRows: resultRawRows };
  }, [parsedData, searchTerm]);

  const handleRemoveTransaction = async (tx: Transaction) => {
    if (!parsedData) return;

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
    if (index === -1) return;

    const nextTransactions = parsedData.transactions.filter((_, i) => i !== index);
    const nextRawRows = parsedData.rawRows ? parsedData.rawRows.filter((_, i) => i !== index) : undefined;
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
      rawRows: nextRawRows,
      summary: {
        record_count: nextTransactions.length,
        total_debit: totals.debit,
        total_credit: totals.credit,
        net_change: totals.credit - totals.debit,
      },
    });
    if (updated) setParsedData(updated);
  };

  return (
    <motion.main
      className="max-w-5xl mx-auto px-4 py-8 space-y-4"
      variants={pageVariants}
      initial="initial"
      animate="animate"
    >
      <ParsedHeader
        bank={parsedData?.bank || ""}
        fromDate={parsedData?.from_date?.toString()}
        toDate={parsedData?.to_date?.toString()}
        dueDate={parsedData?.due_date?.toString()}
        cardType={parsedData?.card_type}
        parsedBy={parsedData?.parsedBy}
        parsedData={parsedData}
        onBack={() => router.back()}
      />

      {parsedData?.parsedBy === "generic" && (
        <UnknownBankBanner rawPageContent={parsedData.rawPageContent ?? []} />
      )}

      <SimpleSearch value={searchTerm} onChange={setSearchTerm} />

      <TransactionsTable
        transactions={filtered}
        searchTerm={searchTerm}
        onRemove={handleRemoveTransaction}
        bank={parsedData?.bank}
        fromDate={parsedData?.from_date?.toString()}
        toDate={parsedData?.to_date?.toString()}
        currency={parsedData?.currency || parsedData?.summary?.currency || "AED"}
        originalHeaders={parsedData?.originalHeaders}
        rawRows={filteredRawRows}
      />
    </motion.main>
  );
}
