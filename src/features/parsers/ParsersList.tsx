"use client";

import { useState, useTransition } from "react";
import { Sparkles, Upload, ToggleLeft, ToggleRight } from "lucide-react";
import { DeleteParserButton } from "./DeleteParserButton";
import { toggleParserAction } from "@/app/actions/saveParser";
import { toast } from "sonner";
import type { ParserConfigData } from "@/lib/parsers/configParser";

type ParserItem = {
  id: string;
  bank: string;
  keywords: string[];
  config: unknown;
  source: string;
  active: boolean;
  status: string;
  createdAt: Date | string;
};

type Props = { items: ParserItem[] };

function ParserRow({ item }: { item: ParserItem }) {
  const config = item.config as ParserConfigData;
  const [active, setActive] = useState(item.active);
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    const next = !active;
    setActive(next);
    startTransition(async () => {
      try {
        await toggleParserAction(item.id, next);
      } catch {
        setActive(!next);
        toast.error("Failed to update parser");
      }
    });
  };

  return (
    <li className="flex items-stretch group">
      <div className="flex-1 min-w-0 px-4 sm:px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-accent-muted ring-1 ring-accent/20 rounded-lg flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-text-primary truncate">{item.bank}</p>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-accent-muted text-accent border border-accent/20 uppercase tracking-wide">
                  AI
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5 font-mono truncate">
                {item.keywords.join(", ")}
              </p>
            </div>
          </div>
          <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full capitalize border ${
            config.cardType === "credit"
              ? "bg-accent-muted text-accent border-accent/20"
              : "bg-success-muted text-success border-success/20"
          }`}>
            {config.cardType}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-2.5">
          {item.status === "pending" ? (
            <span className="flex items-center gap-1 text-xs font-medium text-warning bg-warning-muted border border-warning/20 px-2 py-0.5 rounded-full">
              Pending approval
            </span>
          ) : item.status === "rejected" ? (
            <span className="flex items-center gap-1 text-xs font-medium text-danger bg-danger-muted border border-danger/20 px-2 py-0.5 rounded-full">
              Rejected
            </span>
          ) : (
            <button
              onClick={handleToggle}
              disabled={isPending}
              className={`flex items-center gap-1.5 text-xs transition-colors ${
                active ? "text-success" : "text-text-muted"
              }`}
            >
              {active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              {active ? "Active" : "Inactive"}
            </button>
          )}
          {config.dateFormat && (
            <span className="text-xs text-text-muted font-mono">Format: {config.dateFormat}</span>
          )}
        </div>
      </div>

      <div className="flex items-start px-3 pt-4">
        <DeleteParserButton id={item.id} />
      </div>
    </li>
  );
}

export default function ParsersList({ items }: Props) {
  if (!items || items.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-2xl shadow-surface">
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-12 h-12 rounded-xl bg-accent-muted ring-1 ring-accent/20 flex items-center justify-center mb-4">
            <Sparkles className="w-5 h-5 text-accent" />
          </div>
          <p className="font-display text-sm font-semibold text-text-primary mb-1">No custom parsers yet</p>
          <p className="text-xs text-text-muted mb-5">
            Upload a statement from an unrecognized bank and use AI to parse it.
            You&apos;ll be prompted to save the parser automatically.
          </p>
          <a
            href="/upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-black text-sm font-semibold rounded-lg transition-colors shadow-[0_0_20px_#00d4ff33]"
          >
            <Upload className="w-4 h-4" />
            Upload Statement
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-2xl shadow-surface overflow-hidden">
      <ul className="divide-y divide-border">
        {items.map((item) => (
          <ParserRow key={item.id} item={item} />
        ))}
      </ul>
    </div>
  );
}
