"use client";

import { useState, useTransition } from "react";
import { CreditCard, Lock, Loader2, X } from "lucide-react";
import { saveCardAction } from "@/app/actions/card";
import { toast } from "sonner";

type Props = {
  bank: string;
  cardType: string;
  cardNumber?: string | null;
  usedPassword?: string;
  onDone: () => void;
};

export default function SaveCardPrompt({
  bank,
  cardType,
  cardNumber,
  usedPassword,
  onDone,
}: Props) {
  const [nickname, setNickname] = useState("");
  const [savePassword, setSavePassword] = useState(!!usedPassword);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      try {
        await saveCardAction({
          bank,
          cardType,
          cardNumber: cardNumber ?? null,
          password: savePassword && usedPassword ? usedPassword : null,
          nickname: nickname.trim() || null,
        });
        toast.success("Card saved");
        onDone();
      } catch {
        toast.error("Failed to save card");
        onDone();
      }
    });
  };

  return (
    <div className="bg-white border border-blue-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-blue-500" />
          <p className="text-sm font-semibold text-slate-800">Save this card?</p>
        </div>
        <button
          onClick={onDone}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Card preview */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4 text-blue-500" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800">{bank}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {cardNumber && (
                <span className="text-xs text-slate-400 font-mono">{cardNumber}</span>
              )}
              <span
                className={`text-xs font-medium px-1.5 py-0.5 rounded-full capitalize ${
                  cardType === "credit"
                    ? "bg-purple-50 text-purple-600"
                    : "bg-emerald-50 text-emerald-600"
                }`}
              >
                {cardType}
              </span>
            </div>
          </div>
        </div>

        {/* Nickname */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            Nickname <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            placeholder={`e.g. My ${bank} Card`}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white placeholder:text-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
          />
        </div>

        {/* Save password toggle */}
        {usedPassword && (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={savePassword}
              onChange={(e) => setSavePassword(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-sm text-slate-700">
                Save PDF password for auto-fill next time
              </span>
            </div>
          </label>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save Card
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
