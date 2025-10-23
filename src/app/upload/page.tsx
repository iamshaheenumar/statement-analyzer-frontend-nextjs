"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import { FormValues } from "@/features/upload/types";
import UploadForm from "@/features/upload/UploadForm";
import ParsedList from "@/features/dashboard/ParsedList";
import { useParsedStorage } from "@/features/dashboard/useParsedStorage";
import { ClipboardList, Upload } from "lucide-react";

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
      router.push(`/dashboard?id=${saved?.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to parse file");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectParsed = (id: string) => {
    router.push(`/dashboard?id=${id}`);
  };

  const handleDelete = (id: string) => deleteParsed(id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Left - Title */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900">
                  Upload Statement
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Parse and analyze your bank statements
                </p>
              </div>
            </div>

            {/* Right - Saved Statements Link */}
            <a
              href="/statements"
              className="group relative overflow-hidden px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-2xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/50 transition-all hover:scale-105 self-start sm:self-auto"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="relative flex items-center justify-center gap-2">
                <ClipboardList className="w-5 h-5" />
                Saved Statements
              </span>
            </a>
          </div>
        </div>
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
