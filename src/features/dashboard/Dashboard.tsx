"use client";

import React, { useEffect } from "react";
import { ParsedResponse } from "@/features/dashboard/types";
import SummaryCard from "@/features/dashboard/SummaryCard";
import FilterCard from "@/features/dashboard/FilterCard";
import TransactionsTable from "@/features/dashboard/TransactionsTable";
import ParsedList from "@/features/dashboard/ParsedList";
import { useParsedStorage } from "@/features/dashboard/useParsedStorage";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ListOrdered,
  CloudUpload,
} from "lucide-react";

type Props = {
  data: ParsedResponse;
  filtered: ParsedResponse["transactions"];
  setData: (v: ParsedResponse | null) => void;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  dateFrom: string;
  dateTo: string;
  setDateFrom: (v: string) => void;
  setDateTo: (v: string) => void;
};

export default function Dashboard({
  data,
  filtered,
  setData,
  searchTerm,
  setSearchTerm,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
}: Props) {
  const { parsedList, clearAll, loading } = useParsedStorage();

  const { bank, summary } = data;

  async function handleSaveToCloud() {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      alert("✅ Saved to cloud successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to save to cloud");
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-3">
          <h1 className="text-2xl font-bold text-gray-900">
            {bank} Statement Dashboard
          </h1>
          <div className="flex gap-2">
            <button
              onClick={handleSaveToCloud}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm shadow"
            >
              <CloudUpload className="w-4 h-4" /> Save to Cloud
            </button>
            <button
              onClick={() => setData(null)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm shadow"
            >
              Upload Another
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <SummaryCard
            title="Total Transactions"
            value={summary.record_count}
            icon={<ListOrdered className="text-blue-500 w-6 h-6" />}
          />
          <SummaryCard
            title="Total Debit (AED)"
            value={summary.total_debit.toFixed(2)}
            icon={<TrendingDown className="text-red-500 w-6 h-6" />}
          />
          <SummaryCard
            title="Total Credit (AED)"
            value={summary.total_credit.toFixed(2)}
            icon={<TrendingUp className="text-green-500 w-6 h-6" />}
          />
          <SummaryCard
            title="Net Change (AED)"
            value={summary.net_change.toFixed(2)}
            icon={<Wallet className="text-purple-500 w-6 h-6" />}
            highlight={summary.net_change < 0 ? "red" : "green"}
          />
        </div>

        {/* Recent Parsed Statements */}
        <ParsedList parsedList={parsedList} onSelect={(d) => setData(d)} />

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
        <TransactionsTable transactions={filtered} />

        {/* Manage local data */}
        {!loading && parsedList.length > 0 && (
          <div className="flex justify-end mt-4">
            <button
              onClick={clearAll}
              className="text-xs text-red-500 hover:text-red-700 underline"
            >
              Clear Local Data
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
