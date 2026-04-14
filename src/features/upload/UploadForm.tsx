"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  Upload,
  Lock,
  FileText,
  X,
  AlertCircle,
  Loader2,
  ArrowRight,
  Shield,
  Zap,
  Building2,
} from "lucide-react";

type FormValues = {
  file: FileList;
  password: string;
};

type Props = {
  onSubmit: (data: FormValues) => Promise<void>;
  isLoading: boolean;
  error: string | null;
};

export default function UploadForm({ onSubmit, isLoading, error }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);

  const checkFilePassword = async (f: File) => {
    try {
      const { checkIsPasswordProtected } = await import("@/services/parsePDF");
      const needs = await checkIsPasswordProtected(f);
      setIsPasswordProtected(needs);
    } catch {
      toast.error("Could not read the PDF file");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPassword("");
      setIsPasswordProtected(false);
      await checkFilePassword(selected);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === "application/pdf") {
      setFile(dropped);
      setPassword("");
      setIsPasswordProtected(false);
      await checkFilePassword(dropped);
    } else {
      toast.error("Please drop a PDF file");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error("Please select a PDF file");
    if (isPasswordProtected && !password)
      return toast.error("This PDF requires a password");
    await onSubmit({ file: [file] as any, password });
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setPassword("");
    setIsPasswordProtected(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <form onSubmit={handleSubmit}>
        <div className="p-6 space-y-5">
          {/* File drop zone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              PDF File <span className="text-red-500">*</span>
            </label>

            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative rounded-xl border-2 border-dashed transition-colors ${
                isDragging
                  ? "border-blue-400 bg-blue-50"
                  : file
                  ? "border-slate-200 bg-slate-50"
                  : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100"
              }`}
            >
              {file ? (
                <div className="flex items-center gap-3 p-4">
                  <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4.5 h-4.5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    aria-label="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="py-10 flex flex-col items-center text-center px-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
                      <Upload className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-700">
                      Drop your PDF here or{" "}
                      <span className="text-blue-600">browse</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Up to 10 MB · Password-protected files supported
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Password field */}
          {file && isPasswordProtected && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="password"
                  placeholder="Enter PDF password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg bg-white placeholder:text-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                />
              </div>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!file || isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors
              bg-blue-600 hover:bg-blue-700 text-white
              disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Parsing…
              </>
            ) : (
              <>
                Parse Statement
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Footer bar */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center gap-5">
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <Shield className="w-3.5 h-3.5" />
            Processed locally
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <Zap className="w-3.5 h-3.5" />
            Instant results
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <Building2 className="w-3.5 h-3.5" />
            UAE banks supported
          </span>
        </div>
      </form>
    </div>
  );
}
