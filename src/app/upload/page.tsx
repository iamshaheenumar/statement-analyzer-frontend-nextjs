"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import { FormValues } from "@/features/upload/types";
import UploadForm from "@/features/upload/UploadForm";
import ParsedList from "@/features/dashboard/ParsedList";
import { useParsedStorage } from "@/features/dashboard/useParsedStorage";

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
