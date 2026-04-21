"use client";

import { Trash2, CreditCard, ChevronRight, History } from "lucide-react";
import { ParsedDataWithId } from "./types";
import { useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer, fadeSlideUp } from "@/lib/motion";

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
    <div className="bg-surface rounded-2xl border border-border shadow-surface overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-warning-muted rounded-lg flex items-center justify-center">
            <History className="w-3.5 h-3.5 text-warning" />
          </div>
          <span className="font-display text-sm font-semibold text-text-primary">
            Recent Sessions
          </span>
        </div>
        <span className="text-xs font-medium font-mono text-text-muted bg-elevated px-2 py-0.5 rounded-full">
          {parsedList.length} unsaved
        </span>
      </div>

      {/* List */}
      <motion.ul
        className="divide-y divide-border"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {parsedList.map((item) => (
          <motion.li key={item.id} className="group relative flex items-center" variants={fadeSlideUp}>
            <button
              onClick={() => onSelect(item.id)}
              className="flex-1 flex items-center gap-4 px-5 py-3.5 text-left hover:bg-elevated transition-colors duration-100"
            >
              <div className="w-8 h-8 bg-elevated group-hover:bg-accent-muted rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                <CreditCard className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate font-display">
                  {item.bank}
                </p>
                <p className="text-xs text-text-muted mt-0.5 font-mono">
                  {item.summary.record_count} transactions
                  {item.total_amount_due != null && (
                    <>
                      <span className="mx-1.5">·</span>
                      <span className="text-danger">
                        Due {item.total_amount_due.toFixed(2)} {item.currency || item.summary.currency || "AED"}
                      </span>
                    </>
                  )}
                </p>
              </div>

              <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text-secondary flex-shrink-0 transition-colors" />
            </button>

            {onDelete && (
              <button
                onClick={(e) => handleDelete(e, item.id)}
                className={`mr-4 p-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0 ${
                  confirmId === item.id
                    ? "bg-danger text-white"
                    : "text-text-muted hover:text-danger hover:bg-danger-muted"
                }`}
                title={confirmId === item.id ? "Click again to confirm" : "Delete"}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}
