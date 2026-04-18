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
    <div className="bg-white border border-violet-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-violet-100 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
          </div>
          <p className="text-sm font-semibold text-slate-800">Save AI Parser?</p>
        </div>
        <button
          onClick={onDone}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-5 py-4 space-y-4">
        <p className="text-xs text-slate-500">
          The AI learned the format of this statement. Save the parser so future uploads
          from this bank parse automatically — no AI needed next time.
        </p>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Bank name</label>
          <input
            type="text"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-shadow"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className={`px-2 py-0.5 rounded-full font-medium ${cardType === 'credit' ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {cardType}
          </span>
          <span>{suggestedConfig.keywords.join(', ')}</span>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Save Parser
          </button>
          <button
            onClick={onDone}
            disabled={isPending}
            className="flex-1 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
