"use client";

import { useEffect, useState } from "react";
import StatementsList from "@/features/dashboard/StatementsList";
import { AlertCircle, ClipboardList, Upload } from "lucide-react";

type Item = Parameters<typeof StatementsList>[0]["items"][number];

export default function StatementsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/statements`, { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
        const data = await res.json();
        setItems(data.items || []);
      } catch (e: any) {
        setError(e?.message || "Failed to load statements");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleDelete = (id: string) => {
    //  needs to be implemented
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900">
                  Saved Statements
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  View and manage your cloud-saved statements
                </p>
              </div>
            </div>

            <a
              href="/upload"
              className="group relative overflow-hidden px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/50 transition-all hover:scale-105 self-start sm:self-auto"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="relative flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload New
              </span>
            </a>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-8 text-center">
            <div className="inline-flex items-center gap-3 text-gray-600">
              <svg
                className="animate-spin h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span className="font-medium">Loading saved statements...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-700">
                  Error Loading Statements
                </p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Statements List */}
        {!loading && !error && (
          <StatementsList items={items} onDelete={handleDelete} />
        )}
      </div>
    </div>
  );
}
