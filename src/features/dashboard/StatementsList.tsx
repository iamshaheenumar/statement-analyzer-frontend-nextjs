"use client";

import {
  ClipboardList,
  CircleDollarSign,
  ChevronRight,
  Upload,
  AlertCircle,
  Trash2,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

type StatementItem = {
  id: string;
  bank: string;
  created_at: string | Date;
  summary: {
    record_count: number;
    total_debit: number;
    total_credit: number;
    net_change: number;
  };
};

type Props = {
  items: StatementItem[];
  onDelete?: (id: string) => void;
};

export default function StatementsList({ items, onDelete }: Props) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (deleteConfirm === id) {
      onDelete?.(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  if (!items || items.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Saved Statements</h2>
        </div>

        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
            <ClipboardList className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium mb-1">
            No saved statements yet
          </p>
          <p className="text-sm text-gray-400 mb-6 text-center">
            Use "Save to Cloud" to store a parsed statement
          </p>
          <a
            href="/upload"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-semibold shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
          >
            <Upload className="w-5 h-5" />
            Upload Statement
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">
                Total Statements
              </p>
              <p className="text-2xl font-bold text-gray-900">{items.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">
                Total Transactions
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {items.reduce(
                  (sum, item) => sum + item.summary.record_count,
                  0
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
              <CircleDollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">
                Total Net Change
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {items
                  .reduce((sum, item) => sum + item.summary.net_change, 0)
                  .toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statements List */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                All Statements
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {items.length} statement{items.length !== 1 ? "s" : ""}{" "}
                available
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-xs font-semibold text-green-700">
              Cloud Saved
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative overflow-hidden bg-gradient-to-br from-gray-50 to-white hover:from-white hover:to-gray-50 border-2 border-gray-200 hover:border-orange-300 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/5 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>

              <a
                href={`/view-parsed?id=${item.id}`}
                className="relative block p-5"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Left Section */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                        <svg
                          className="w-5 h-5 text-orange-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors truncate">
                          {item.bank}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            {new Date(item.created_at).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 ml-0 sm:ml-13">
                      <div className="bg-blue-50 rounded-xl px-3 py-2">
                        <p className="text-xs text-gray-500 mb-0.5">
                          Transactions
                        </p>
                        <p className="text-sm font-bold text-blue-700">
                          {item.summary.record_count}
                        </p>
                      </div>

                      <div className="bg-red-50 rounded-xl px-3 py-2">
                        <p className="text-xs text-gray-500 mb-0.5">
                          Total Debit
                        </p>
                        <p className="text-sm font-bold text-red-600">
                          {item.summary.total_debit.toFixed(2)}
                        </p>
                      </div>

                      <div className="bg-green-50 rounded-xl px-3 py-2">
                        <p className="text-xs text-gray-500 mb-0.5">
                          Total Credit
                        </p>
                        <p className="text-sm font-bold text-green-600">
                          {item.summary.total_credit.toFixed(2)}
                        </p>
                      </div>

                      <div
                        className={`${
                          item.summary.net_change >= 0
                            ? "bg-green-50"
                            : "bg-red-50"
                        } rounded-xl px-3 py-2`}
                      >
                        <p className="text-xs text-gray-500 mb-0.5">
                          Net Change
                        </p>
                        <p
                          className={`text-sm font-bold ${
                            item.summary.net_change >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {item.summary.net_change >= 0 ? "+" : ""}
                          {item.summary.net_change.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Section */}
                  <div className="flex items-center justify-end gap-3">
                    <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>
                </div>
              </a>

              {/* Delete Button */}
              {onDelete && (
                <div className="absolute top-3 right-3 z-10">
                  <button
                    onClick={(e) => handleDelete(e, item.id)}
                    className={`group/delete p-2 rounded-xl transition-all duration-300 ${
                      deleteConfirm === item.id
                        ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30"
                        : "bg-white/80 hover:bg-red-50 border border-gray-200 hover:border-red-300"
                    }`}
                    title={
                      deleteConfirm === item.id
                        ? "Click again to confirm"
                        : "Delete statement"
                    }
                  >
                    {deleteConfirm === item.id ? (
                      <AlertCircle className="w-4 h-4 text-white" />
                    ) : (
                      <Trash2 className="w-4 h-4 text-gray-400 group-hover/delete:text-red-500 transition-colors" />
                    )}
                  </button>
                </div>
              )}

              {/* Delete Confirmation Tooltip */}
              {deleteConfirm === item.id && (
                <div className="absolute top-14 right-3 bg-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-lg z-20 whitespace-nowrap animate-pulse">
                  Click again to confirm
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
