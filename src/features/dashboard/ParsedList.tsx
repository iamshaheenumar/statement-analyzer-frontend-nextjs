"use client";

import { Trash2, CreditCard, ChevronRight, History } from "lucide-react";
import { ParsedDataWithId } from "./types";
import { useState } from "react";

type Props = {
  parsedList: ParsedDataWithId[];
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void;
};

export default function ParsedList({ parsedList, onSelect, onDelete }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirmId === id) {
      onDelete?.(id);
      setConfirmId(null);
    } else {
      setConfirmId(id);
      setTimeout(() => setConfirmId(null), 3000);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
            <History className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <span className="text-sm font-semibold text-slate-800">
            Recent Sessions
          </span>
        </div>
        <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
          {parsedList.length} unsaved
        </span>
      </div>

      {/* List */}
      <ul className="divide-y divide-slate-100">
        {parsedList.map((item) => (
          <li key={item.id} className="group relative flex items-center">
            <button
              onClick={() => onSelect(item.id)}
              className="flex-1 flex items-center gap-4 px-5 py-3.5 text-left hover:bg-slate-50 transition-colors"
            >
              {/* Icon */}
              <div className="w-8 h-8 bg-slate-100 group-hover:bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                <CreditCard className="w-4 h-4 text-slate-500 group-hover:text-blue-600 transition-colors" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {item.bank}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {item.summary.record_count} transactions
                  <span className="mx-1.5">·</span>
                  <span
                    className={
                      item.summary.net_change >= 0
                        ? "text-green-600"
                        : "text-red-500"
                    }
                  >
                    {item.summary.net_change >= 0 ? "+" : ""}
                    {item.summary.net_change.toFixed(2)} AED
                  </span>
                </p>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 flex-shrink-0 transition-colors" />
            </button>

            {/* Delete */}
            {onDelete && (
              <button
                onClick={(e) => handleDelete(e, item.id)}
                className={`mr-4 p-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0 ${
                  confirmId === item.id
                    ? "bg-red-500 text-white"
                    : "text-slate-300 hover:text-red-400 hover:bg-red-50"
                }`}
                title={confirmId === item.id ? "Click again to confirm" : "Delete"}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
