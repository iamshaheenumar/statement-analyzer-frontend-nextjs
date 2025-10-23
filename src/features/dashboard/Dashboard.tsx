"use client";

import React, { useEffect, useState } from "react";
import { ParsedData, ParsedDataWithId } from "@/features/dashboard/types";
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
  ArrowLeft,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { parseISO } from "date-fns";

export default function Dashboard() {
  const router = useRouter();
  const { parsedList, deleteParsed, loading } = useParsedStorage();

  const [parsedData, setParsedData] = useState<ParsedDataWithId | null>(null);
  const [filtered, setFiltered] = useState<ParsedData["transactions"]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const params = useSearchParams();

  const id = params.get("id");
  const parsed = parsedList.find((p) => p.id === id);

  useEffect(() => {
    if (!parsed && parsedList.length > 0 && !id) {
      // if no specific ID, load latest
      router.replace(`/dashboard?id=${parsedList[parsedList.length - 1].id}`);
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

  async function handleSaveToCloud() {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedData),
      });
      alert("✅ Saved to cloud successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to save to cloud");
    }
  }

  const handleSelectParsed = (id: string) => {
    router.push(`/dashboard?id=${id}`);
  };

  const handleDelete = (id: string) => deleteParsed(id);

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
                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={() => router.push("/upload")}
                    className="group flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all hover:scale-110 hover:shadow-md"
                  >
                    <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
                  </button>

                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                </div>

                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 mb-2 leading-tight">
                  {bank}
                </h1>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                    Statement Dashboard
                  </span>
                  <span className="text-sm text-gray-500">
                    {summary.record_count} transactions
                  </span>
                </div>
              </div>

              {/* Right Side - Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSaveToCloud}
                  className="group relative overflow-hidden px-6 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-2xl font-semibold shadow-lg shadow-green-500/30 transition-all hover:shadow-2xl hover:shadow-green-500/50 hover:scale-105"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <span className="relative flex items-center justify-center gap-2">
                    <CloudUpload className="w-5 h-5 transition-transform group-hover:-translate-y-1 group-hover:scale-110" />
                    Save to Cloud
                  </span>
                </button>

                <button
                  onClick={() => setParsedData(null)}
                  className="group relative overflow-hidden px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-semibold shadow-lg shadow-blue-500/30 transition-all hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-105"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <span className="relative flex items-center justify-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    Upload Another
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
        <TransactionsTable transactions={filtered} />

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
