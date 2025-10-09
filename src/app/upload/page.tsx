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
  const { parsedList, addParsed } = useParsedStorage();
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

      addParsed(res.data);
      localStorage.setItem("latestParsed", JSON.stringify(res.data));
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to parse file");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectParsed = (parsed: any) => {
    localStorage.setItem("latestParsed", JSON.stringify(parsed));
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6 flex flex-col items-center">
      {/* Upload Form */}
      <UploadForm onSubmit={onSubmit} isLoading={isLoading} error={error} />

      {/* Recent Statements */}
      <div className="mt-8">
        <ParsedList parsedList={parsedList} onSelect={handleSelectParsed} />
      </div>
    </div>
  );
}
