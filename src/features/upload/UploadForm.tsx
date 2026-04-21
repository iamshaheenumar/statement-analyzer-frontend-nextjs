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
  CreditCard,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { dropzoneVariants, fileEntryVariants } from "@/lib/motion";
import type { SavedCard } from "./types";

type FormValues = {
  file: FileList;
  password: string;
};

type Props = {
  onSubmit: (data: FormValues) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  savedCards?: SavedCard[];
};

export default function UploadForm({
  onSubmit,
  isLoading,
  error,
  savedCards = [],
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);

  const selectedCard = savedCards.find((c) => c.id === selectedCardId) ?? null;

  const checkFilePassword = async (f: File) => {
    try {
      const { checkIsPasswordProtected } = await import("@/services/parsePDF");
      const needs = await checkIsPasswordProtected(f);
      setIsPasswordProtected(needs);
    } catch {
      toast.error("Could not read the PDF file");
    }
  };

  const handleFile = async (f: File) => {
    setFile(f);
    setIsPasswordProtected(false);
    await checkFilePassword(f);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) await handleFile(selected);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === "application/pdf") {
      await handleFile(dropped);
    } else {
      toast.error("Please drop a PDF file");
    }
  };

  const handleCardSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedCardId(id);
    const card = savedCards.find((c) => c.id === id) ?? null;
    setPassword(card?.password ?? "");
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

  const dropzoneState = isDragging ? "dragging" : file ? "accepted" : "idle";

  const cardLabel = (card: SavedCard) =>
    card.nickname ||
    `${card.bank}${card.cardVariant ? ` ${card.cardVariant}` : ""} ${card.cardType === "credit" ? "Credit" : "Debit"}`;

  return (
    <div className="bg-surface rounded-2xl border border-border shadow-surface overflow-hidden">
      <form onSubmit={handleSubmit}>
        <div className="p-6 space-y-5">
          {/* File drop zone */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2">
              PDF File <span className="text-danger">*</span>
            </label>

            <motion.div
              animate={dropzoneState}
              variants={dropzoneVariants}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative rounded-xl border-2 border-dashed transition-colors ${
                isDragging
                  ? "border-accent bg-accent-muted"
                  : file
                  ? "border-border bg-elevated"
                  : "border-border bg-base hover:border-border-bright hover:bg-elevated"
              }`}
            >
              <AnimatePresence mode="wait">
                {file ? (
                  <motion.div
                    key="file"
                    variants={fileEntryVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="flex items-center gap-3 p-4"
                  >
                    <div className="w-9 h-9 bg-accent-muted rounded-lg ring-1 ring-accent/20 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="p-1.5 text-text-muted hover:text-danger hover:bg-danger-muted rounded-lg transition-colors"
                      aria-label="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="py-10 flex flex-col items-center text-center px-4">
                      <div className="w-10 h-10 bg-elevated rounded-xl flex items-center justify-center mb-3">
                        <Upload className="w-5 h-5 text-text-muted" />
                      </div>
                      <p className="text-sm font-medium text-text-secondary">
                        Drop your PDF here or{" "}
                        <span className="text-accent">browse</span>
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        Up to 10 MB · Password-protected files supported
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Saved card selector */}
          {savedCards.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">
                Saved Card <span className="text-text-muted font-normal">(optional)</span>
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                <select
                  value={selectedCardId}
                  onChange={handleCardSelect}
                  className="w-full pl-9 pr-8 py-2.5 text-sm border border-border rounded-lg bg-base text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-shadow appearance-none"
                >
                  <option value="">None — enter password manually</option>
                  {savedCards.map((card) => (
                    <option key={card.id} value={card.id}>
                      {cardLabel(card)}
                      {card.password ? " (password saved)" : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              </div>
            </div>
          )}

          {/* Password field */}
          {file && isPasswordProtected && (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">
                Password <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                <input
                  type="password"
                  placeholder="Enter PDF password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setSelectedCardId("");
                  }}
                  required
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-lg bg-base placeholder:text-text-muted text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-shadow"
                />
              </div>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-2.5 p-3 bg-danger-muted border border-danger/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-danger mt-0.5 flex-shrink-0" />
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!file || isLoading}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
              !file || isLoading
                ? "bg-elevated text-text-muted cursor-not-allowed"
                : "bg-accent hover:bg-accent/90 text-black shadow-[0_0_20px_#00d4ff33]"
            }`}
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
        <div className="px-6 py-3.5 bg-base border-t border-border flex flex-wrap items-center gap-5">
          <span className="flex items-center gap-1.5 text-xs text-text-muted">
            <Shield className="w-3.5 h-3.5" />
            Processed locally
          </span>
          <span className="flex items-center gap-1.5 text-xs text-text-muted">
            <Zap className="w-3.5 h-3.5" />
            Instant results
          </span>
          <span className="flex items-center gap-1.5 text-xs text-text-muted">
            <Building2 className="w-3.5 h-3.5" />
            UAE banks supported
          </span>
        </div>
      </form>
    </div>
  );
}
