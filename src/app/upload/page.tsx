"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { motion } from "framer-motion";
import { format, parseISO, isWithinInterval } from "date-fns";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ListOrdered,
  Search,
} from "lucide-react";

type FormValues = {
  file: FileList;
  password?: string;
};

type ParsedResponse = {
  bank: string;
  summary: {
    record_count: number;
    total_debit: number;
    total_credit: number;
    net_change: number;
  };
  transactions: {
    transaction_date: string; // now "2025-07-11"
    description: string;
    debit: number;
    credit: number;
    amount: number;
    bank: string;
  }[];
};

export default function UploadPage() {
  const { register, handleSubmit, reset } = useForm<FormValues>();
  const [parsedData, setParsedData] = useState<ParsedResponse | null>(null);
  const [filtered, setFiltered] = useState<ParsedResponse["transactions"]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // --- Handle API upload ---
  const onSubmit = async (data: FormValues) => {
    setError(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", data.file[0]);
      if (data.password) formData.append("password", data.password);

      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/parse`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setParsedData(res.data);
      setFiltered(res.data.transactions);
      reset();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to parse file");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Filter Logic (Search + Date Range) ---
  useEffect(() => {
    if (!parsedData) return;

    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo) : null;

    const filteredTxns = parsedData.transactions.filter((t) => {
      const dateObj = parseISO(t.transaction_date);
      const matchesText = t.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const inRange =
        !fromDate ||
        !toDate ||
        isWithinInterval(dateObj, { start: fromDate, end: toDate });

      return matchesText && inRange;
    });

    setFiltered(filteredTxns);
  }, [searchTerm, dateFrom, dateTo, parsedData]);

  // --- Dashboard View ---
  if (parsedData) {
    const { bank, summary } = parsedData;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gray-100 p-6"
      >
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              {bank} Statement Dashboard
            </h1>
            <button
              onClick={() => {
                setParsedData(null);
                setSearchTerm("");
                setDateFrom("");
                setDateTo("");
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm shadow"
            >
              Upload Another
            </button>
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

          {/* Filters Card */}
          <div className="bg-white shadow rounded-2xl p-4 mb-6">
            <h2 className="text-sm font-semibold text-gray-600 mb-3 px-1">
              🔍 Search & Filter
            </h2>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              {/* Search Field */}
              <div className="flex items-center border border-gray-200 rounded-lg px-3 py-2 w-full md:w-1/2 bg-gray-50">
                <Search className="w-5 h-5 text-gray-500 mr-2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by description..."
                  className="flex-1 outline-none bg-transparent text-gray-800 placeholder-gray-400 text-sm"
                />
              </div>

              {/* Date Range Fields */}
              <div className="flex items-center border border-gray-200 rounded-lg px-3 py-2 gap-2 w-full md:w-auto bg-gray-50">
                <div className="flex items-center gap-1">
                  <label className="text-xs text-gray-500">From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="border border-gray-200 rounded-md px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <label className="text-xs text-gray-500">To</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="border border-gray-200 rounded-md px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white shadow rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left border-collapse">
                <thead className="bg-gray-50 border-b sticky top-0">
                  <tr>
                    <th className="py-3 px-4 text-gray-600 font-semibold">
                      Sl No
                    </th>
                    <th className="py-3 px-4 text-gray-600 font-semibold whitespace-nowrap">
                      Date
                    </th>
                    <th className="py-3 px-4 text-gray-600 font-semibold">
                      Description
                    </th>
                    <th className="py-3 px-4 text-gray-600 font-semibold text-right whitespace-nowrap">
                      Debit (AED)
                    </th>
                    <th className="py-3 px-4 text-gray-600 font-semibold text-right whitespace-nowrap">
                      Credit (AED)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-6 text-gray-500 italic"
                      >
                        No transactions found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((t, i) => (
                      <tr
                        key={i}
                        className="border-b last:border-0 hover:bg-gray-50 transition"
                      >
                        <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                          {i + 1}
                        </td>
                        <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                          {format(parseISO(t.transaction_date), "dd MMM yyyy")}
                        </td>
                        <td className="py-3 px-4 text-gray-700 min-w-[200px]">
                          {t.description}
                        </td>
                        <td className="py-3 px-4 text-right text-red-600 whitespace-nowrap">
                          {t.debit ? t.debit.toFixed(2) : "-"}
                        </td>
                        <td className="py-3 px-4 text-right text-green-600 whitespace-nowrap">
                          {t.credit ? t.credit.toFixed(2) : "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // --- Upload Form ---
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">
          Upload Bank Statement
        </h1>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col space-y-5"
        >
          <div className="flex flex-col">
            <label className="text-gray-800 font-medium mb-1">
              PDF File <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              accept="application/pdf"
              {...register("file", { required: true })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800
                         bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500
                         file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 
                         file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-gray-800 font-medium mb-1">
              Password (if any)
            </label>
            <input
              type="password"
              placeholder="Enter PDF password"
              {...register("password")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm 
                         text-gray-900 placeholder-gray-400 bg-gray-50
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg py-2.5 
                       transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? "Parsing..." : "Upload & Parse"}
          </button>
        </form>

        {error && (
          <p className="text-red-600 text-sm mt-4 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}

/* --- Reusable Summary Card --- */
function SummaryCard({
  title,
  value,
  icon,
  highlight,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  highlight?: "red" | "green";
}) {
  return (
    <div
      className={`rounded-2xl p-4 bg-white shadow-sm border-t-4 flex flex-col items-center justify-center space-y-2
      ${
        highlight === "red"
          ? "border-red-500"
          : highlight === "green"
          ? "border-green-500"
          : "border-blue-500"
      }`}
    >
      <div className="bg-gray-100 rounded-full p-2">{icon}</div>
      <p className="text-sm text-gray-500 text-center">{title}</p>
      <p className="text-xl font-semibold text-gray-800">{value}</p>
    </div>
  );
}
