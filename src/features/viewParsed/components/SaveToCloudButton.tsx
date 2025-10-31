"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CloudUpload } from "lucide-react";
import { toast } from "sonner";
import type { ParsedDataWithId } from "@/features/dashboard/types";
import { useParsedStorage } from "@/features/dashboard/useParsedStorage";
import { saveStatementAction } from "@/app/actions/saveStatement";

type Props = {
  parsedData?: ParsedDataWithId | null;
  saving?: boolean;
  onSavingChange?: (value: boolean) => void;
  className?: string;
};

export default function SaveToCloudButton({
  parsedData,
  saving: externalSaving,
  onSavingChange,
  className,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const { deleteParsed } = useParsedStorage();
  const router = useRouter();
  const [internalSaving, setInternalSaving] = useState(false);

  const saving = externalSaving ?? internalSaving;
  const setSaving = onSavingChange ?? setInternalSaving;

  const disabled = !parsedData || saving;
  const classes = [
    "group relative overflow-hidden px-5 py-2.5 sm:px-6 sm:py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-2xl font-semibold shadow-lg shadow-green-500/30 transition-all hover:shadow-2xl hover:shadow-green-500/50 hover:scale-105 disabled:shadow-none disabled:cursor-not-allowed",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const handleClick = () => {
    if (!parsedData || isPending) return;

    startTransition(async () => {
      try {
        await saveStatementAction(parsedData);
        await deleteParsed(parsedData.id);
        toast.success("Saved to cloud successfully!");
        router.push("/statements");
      } catch (error) {
        console.error(error);
        toast.error("Unable to save right now. Please try again later.");
      }
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      aria-busy={saving}
      className={classes}
    >
      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
      <span className="relative flex items-center justify-center gap-2">
        <CloudUpload
          className={`w-5 h-5 transition-transform ${
            saving
              ? "animate-bounce"
              : "group-hover:-translate-y-1 group-hover:scale-110"
          }`}
        />
        {saving ? "Saving..." : "Save to Cloud"}
      </span>
    </button>
  );
}
