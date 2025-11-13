"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import { FormValues } from "@/features/upload/types";
import UploadForm from "@/features/upload/UploadForm";
import ParsedList from "@/features/dashboard/ParsedList";
import { useParsedStorage } from "@/features/dashboard/useParsedStorage";
import { ClipboardList, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export default function UploadPage() {
  const router = useRouter();
  const { parsedList, addParsed, deleteParsed } = useParsedStorage();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

      const saved = await addParsed(res.data);
      router.push(`/view-parsed?id=${saved?.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to parse file");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectParsed = (id: string) => {
    router.push(`/view-parsed?id=${id}`);
  };

  const handleDelete = (id: string) => deleteParsed(id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 px-4 py-12">
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex gap-3 justify-end">
          <Link
            href="/dashboard"
            className="group relative overflow-hidden px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/50 transition-all hover:scale-105"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <span className="relative flex items-center gap-2 text-sm">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </span>
          </Link>

          <Link
            href="/statements"
            className="group relative overflow-hidden px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/50 transition-all hover:scale-105"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <span className="relative flex items-center gap-2 text-sm">
              <ClipboardList className="w-4 h-4" />
              Statements
            </span>
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-8">
        {/* Upload Form */}
        <UploadForm onSubmit={onSubmit} isLoading={isLoading} error={error} />

        {/* Recent Statements - Only shows when there are items */}
        {parsedList.length > 0 && (
          <ParsedList
            parsedList={parsedList}
            onSelect={handleSelectParsed}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}
