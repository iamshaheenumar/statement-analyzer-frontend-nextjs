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
            <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-violet-500" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-800 truncate">{item.bank}</p>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600 uppercase tracking-wide">
                  AI
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                {item.keywords.join(", ")}
              </p>
            </div>
          </div>
          <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
            config.cardType === "credit"
              ? "bg-purple-50 text-purple-600"
              : "bg-emerald-50 text-emerald-600"
          }`}>
            {config.cardType}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-2.5">
          {item.status === "pending" ? (
            <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              Pending approval
            </span>
          ) : item.status === "rejected" ? (
            <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
              Rejected
            </span>
          ) : (
            <button
              onClick={handleToggle}
              disabled={isPending}
              className={`flex items-center gap-1.5 text-xs transition-colors ${
                active ? "text-emerald-600" : "text-slate-400"
              }`}
            >
              {active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              {active ? "Active" : "Inactive"}
            </button>
          )}
          {config.dateFormat && (
            <span className="text-xs text-slate-300">Format: {config.dateFormat}</span>
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
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center mb-4">
            <Sparkles className="w-5 h-5 text-violet-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700 mb-1">No custom parsers yet</p>
          <p className="text-xs text-slate-400 mb-5">
            Upload a statement from an unrecognized bank and use AI to parse it.
            You&apos;ll be prompted to save the parser automatically.
          </p>
          <a
            href="/upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Statement
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <ul className="divide-y divide-slate-100">
        {items.map((item) => (
          <ParserRow key={item.id} item={item} />
        ))}
      </ul>
    </div>
  );
}
