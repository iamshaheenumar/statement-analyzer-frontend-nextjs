"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import { FormValues } from "@/features/upload/types";
import UploadForm from "@/features/upload/UploadForm";
import ParsedList from "@/features/dashboard/ParsedList";
import { useParsedStorage } from "@/features/dashboard/useParsedStorage";
import Navbar from "@/components/Navbar";

export default function UploadPage() {
  const router = useRouter();
  const { parsedList, addParsed, deleteParsed } = useParsedStorage();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: FormValues) => {
    setError(null);
    setIsLoading(true);

    try {
      const { extractPdfPages } = await import("@/services/parsePDF");
      const pages = await extractPdfPages(
        data.file[0],
        data.password || undefined
      );

      const res = await axios.post("/api/parse", { pages });

      const saved = await addParsed(res.data);
      router.push(`/view-parsed?id=${saved?.id}`);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          "Failed to parse file"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Page content */}
      <main className="max-w-xl mx-auto px-4 py-12">
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Import Statement
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload a bank PDF to extract and review your transactions.
          </p>
        </div>

        <UploadForm onSubmit={onSubmit} isLoading={isLoading} error={error} />

        {parsedList.length > 0 && (
          <div className="mt-8">
            <ParsedList
              parsedList={parsedList}
              onSelect={(id) => router.push(`/view-parsed?id=${id}`)}
              onDelete={(id) => deleteParsed(id)}
            />
          </div>
        )}
      </main>
    </div>
  );
}
