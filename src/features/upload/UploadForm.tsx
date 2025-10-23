import React, { useState } from "react";
import { toast } from "sonner";
import { Upload, Lock, FileText, Cloud, Zap, CheckCircle, AlertCircle } from "lucide-react";

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === "application/pdf") {
      setFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleServerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a PDF file first");
      return;
    }
    const formData = { file: [file] as any, password };
    await onSubmit(formData);
  };

  const handleClientParse = async () => {
    if (!file) {
      toast.error("Please select a PDF file first");
      return;
    }
    // Client-side parsing logic would go here
    toast.info(`Parsing ${file.name} locally...`);
  };

  return (
    <div className="items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-2xl shadow-blue-500/30 mb-4">
            <Upload className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 mb-3">
            Upload Your Statement
          </h1>
          <p className="text-gray-600 text-lg">
            Parse and analyze your bank statements instantly
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-6">
          <form onSubmit={handleServerSubmit} className="space-y-6">
            {/* File Upload Area */}
            <div>
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
                PDF Document <span className="text-red-500">*</span>
              </label>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative group border-3 border-dashed rounded-2xl transition-all duration-300 ${
                  isDragging
                    ? "border-blue-500 bg-blue-50"
                    : file
                    ? "border-green-400 bg-green-50"
                    : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50"
                }`}
              >
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />

                <div className="p-8 text-center">
                  {file ? (
                    <div className="space-y-3">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg">
                        <CheckCircle className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-gray-900 mb-1">
                          {file.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                        }}
                        className="text-sm text-red-600 hover:text-red-700 font-semibold underline"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 group-hover:from-blue-200 group-hover:to-purple-200 transition-all">
                        <FileText className="w-8 h-8 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-gray-900 mb-1">
                          Drop your PDF here
                        </p>
                        <p className="text-sm text-gray-500">
                          or{" "}
                          <span className="text-blue-600 font-semibold">
                            browse
                          </span>{" "}
                          to upload
                        </p>
                      </div>
                      <p className="text-xs text-gray-400">
                        Maximum file size: 10MB
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
                Password (Optional)
              </label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-300"></div>
                <div className="relative flex items-center bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-2xl px-4 py-3.5 transition-all duration-300 focus-within:border-purple-500 focus-within:shadow-lg focus-within:shadow-purple-500/20">
                  <Lock className="w-5 h-5 text-gray-400 mr-3" />
                  <input
                    type="password"
                    placeholder="Enter PDF password if protected"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex-1 outline-none bg-transparent text-gray-800 placeholder-gray-400 text-sm font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Server Parse Button */}
              <button
                type="submit"
                disabled={isLoading || !file}
                className="group relative overflow-hidden px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/50 disabled:shadow-none transition-all hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span className="relative flex items-center justify-center gap-2">
                  <Cloud className="w-5 h-5" />
                  {isLoading ? "Parsing..." : "Parse on Server"}
                </span>
              </button>

              {/* Client Parse Button */}
              <button
                type="button"
                onClick={handleClientParse}
                disabled={!file}
                className="group relative overflow-hidden px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-2xl font-bold shadow-lg shadow-green-500/30 hover:shadow-2xl hover:shadow-green-500/50 disabled:shadow-none transition-all hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <span className="relative flex items-center justify-center gap-2">
                  <Zap className="w-5 h-5" />
                  Parse Locally
                </span>
              </button>
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm font-semibold text-red-700">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 border border-white/20">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-3 shadow-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Fast Processing</h3>
            <p className="text-sm text-gray-600">Parse statements in seconds</p>
          </div>

          <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 border border-white/20">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-3 shadow-lg">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Secure & Private</h3>
            <p className="text-sm text-gray-600">Your data stays protected</p>
          </div>

          <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 border border-white/20">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-3 shadow-lg">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Auto Detection</h3>
            <p className="text-sm text-gray-600">
              Identifies bank automatically
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
