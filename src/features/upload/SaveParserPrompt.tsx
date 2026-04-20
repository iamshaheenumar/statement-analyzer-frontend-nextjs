"use client";

import { useState, useTransition } from "react";
import { Sparkles, Loader2, X } from "lucide-react";
import { saveParserAction } from "@/app/actions/saveParser";
import { toast } from "sonner";
import type { ParserConfigData } from "@/lib/parsers/configParser";

type Props = {
  bank: string;
  cardType: string;
  suggestedConfig: ParserConfigData;
  onDone: () => void;
};

export default function SaveParserPrompt({ bank, cardType, suggestedConfig, onDone }: Props) {
  const [bankName, setBankName] = useState(bank);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      try {
        await saveParserAction({
          bank: bankName.trim() || bank,
          keywords: suggestedConfig.keywords,
          config: { ...suggestedConfig, bankName: bankName.trim() || bank },
        });
        toast.success("Parser saved — future statements from this bank will parse automatically");
        onDone();
      } catch {
        toast.error("Failed to save parser");
        onDone();
      }
    });
  };

  return (
    <div className="bg-surface border border-border rounded-2xl shadow-surface overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-accent-muted ring-1 ring-accent/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
          </div>
          <p className="font-display text-sm font-semibold text-text-primary">Save AI Parser?</p>
        </div>
        <button
          onClick={onDone}
          className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-elevated transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-5 py-4 space-y-4">
        <p className="text-xs text-text-secondary">
          The AI learned the format of this statement. Save the parser so future uploads
          from this bank parse automatically — no AI needed next time.
        </p>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">Bank name</label>
          <input
            type="text"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-base text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-shadow"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span className={`px-2 py-0.5 rounded-full font-medium border ${
            cardType === "credit"
              ? "bg-accent-muted text-accent border-accent/20"
              : "bg-success-muted text-success border-success/20"
          }`}>
            {cardType}
          </span>
          <span className="font-mono">{suggestedConfig.keywords.join(", ")}</span>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold bg-accent hover:bg-accent/90 text-black transition-colors disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Save Parser
          </button>
          <button
            onClick={onDone}
            disabled={isPending}
            className="flex-1 py-2 rounded-lg text-sm font-semibold text-text-secondary hover:bg-elevated transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
