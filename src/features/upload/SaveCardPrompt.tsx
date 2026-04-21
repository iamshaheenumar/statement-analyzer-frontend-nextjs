"use client";

import { useState, useTransition } from "react";
import { CreditCard, Lock, Loader2, X } from "lucide-react";
import { saveCardAction } from "@/app/actions/card";
import { toast } from "sonner";

type Props = {
  bank: string;
  cardType: string;
  cardVariant?: string | null;
  usedPassword?: string;
  onDone: () => void;
};

export default function SaveCardPrompt({
  bank,
  cardType,
  cardVariant,
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
          cardVariant: cardVariant ?? null,
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
    <div className="bg-surface border border-border rounded-2xl shadow-surface overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-accent" />
          <p className="font-display text-sm font-semibold text-text-primary">Save this card?</p>
        </div>
        <button
          onClick={onDone}
          className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-elevated transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Card preview */}
        <div className="flex items-center gap-3 p-3 bg-elevated rounded-xl">
          <div className="w-8 h-8 bg-accent-muted rounded-lg ring-1 ring-accent/20 flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4 text-accent" />
          </div>
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold text-text-primary">{bank}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {cardVariant && (
                <span className="text-xs text-text-muted">{cardVariant}</span>
              )}
              <span
                className={`text-xs font-medium px-1.5 py-0.5 rounded-full capitalize border ${
                  cardType === "credit"
                    ? "bg-accent-muted text-accent border-accent/20"
                    : "bg-success-muted text-success border-success/20"
                }`}
              >
                {cardType}
              </span>
            </div>
          </div>
        </div>

        {/* Nickname */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">
            Nickname <span className="text-text-muted font-normal">(optional)</span>
          </label>
          <input
            type="text"
            placeholder={`e.g. My ${bank} Card`}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-base placeholder:text-text-muted text-text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-shadow"
          />
        </div>

        {/* Save password toggle */}
        {usedPassword && (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={savePassword}
              onChange={(e) => setSavePassword(e.target.checked)}
              className="w-4 h-4 rounded border-border accent-accent"
            />
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-sm text-text-secondary">
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
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold bg-accent hover:bg-accent/90 text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save Card
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
