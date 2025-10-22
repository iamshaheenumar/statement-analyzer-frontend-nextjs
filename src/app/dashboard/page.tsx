"use client";

import { useEffect, useState } from "react";
import { parseISO } from "date-fns";
import Dashboard from "@/features/dashboard/Dashboard";
import { ParsedData, ParsedDataWithId } from "@/features/dashboard/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useParsedStorage } from "@/features/dashboard/useParsedStorage";

export default function DashboardPage() {
  const router = useRouter();

  const [parsedData, setParsedData] = useState<ParsedDataWithId | null>(null);
  const [filtered, setFiltered] = useState<ParsedData["transactions"]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { parsedList } = useParsedStorage();
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

  // No data? Redirect to upload
  if (!parsedData)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-600 text-sm mb-4">No parsed data found.</p>
        <button
          onClick={() => router.push("/upload")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
        >
          Go to Upload
        </button>
      </div>
    );

  return (
    <Dashboard
      data={parsedData}
      filtered={filtered}
      setData={setParsedData}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      dateFrom={dateFrom}
      setDateFrom={setDateFrom}
      dateTo={dateTo}
      setDateTo={setDateTo}
    />
  );
}
