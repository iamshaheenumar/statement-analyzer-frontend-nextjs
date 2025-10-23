"use client";

import { useEffect, useState } from "react";
import StatementsList from "@/features/dashboard/StatementsList";

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Saved Statements</h1>
            <a
              href="/upload"
              className="inline-flex items-center px-4 py-2 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md"
            >
              Upload New
            </a>
          </div>
        </div>

        {loading && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-6 text-gray-500">
            Loading saved statements...
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-2xl p-4 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && <StatementsList items={items} />}
      </div>
    </div>
  );
}

