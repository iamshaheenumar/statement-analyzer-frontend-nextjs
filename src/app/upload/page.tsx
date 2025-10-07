"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { parseISO } from "date-fns";
import { ParsedResponse } from "@/features/dashboard/types";
import { FormValues } from "@/features/upload/types";
import Dashboard from "@/features/dashboard/Dashboard";
import UploadForm from "@/features/upload/UploadForm";
import { useParsedStorage } from "@/features/dashboard/useParsedStorage";

export default function UploadPage() {
  const { parsedList, addParsed, clearAll, loading } = useParsedStorage();
  const [parsedData, setParsedData] = useState<ParsedResponse | null>(null);
  const [filtered, setFiltered] = useState<ParsedResponse["transactions"]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

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
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setParsedData(res.data);
      addParsed(res.data);
      setFiltered(res.data.transactions);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to parse file");
    } finally {
      setIsLoading(false);
    }
  };

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

  if (parsedData)
    return (
      <Dashboard
        data={parsedData}
        filtered={filtered}
        setData={setParsedData}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        dateFrom={dateFrom}
        dateTo={dateTo}
        setDateFrom={setDateFrom}
        setDateTo={setDateTo}
      />
    );

  return <UploadForm onSubmit={onSubmit} isLoading={isLoading} error={error} />;
}
