"use client";

import { ChevronRight, FileText, Upload, Calendar } from "lucide-react";
import { DeleteButton } from "./DeleteStatementButton";
import { formatDate } from "@/utils/date";
import { motion } from "framer-motion";
import { staggerContainer, fadeSlideUp } from "@/lib/motion";

type StatementItem = {
  id: string;
  bank: string;
  created_at: string | Date;
  card_type?: string | null;
  currency?: string | null;
  from_date: Date | null;
  to_date: Date | null;
  summary: {
    record_count: number;
    total_debit: number;
    total_credit: number;
    net_change: number;
  };
};

type Props = { items: StatementItem[] };

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function StatementsList({ items }: Props) {
  if (!items || items.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-2xl shadow-surface">
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-12 h-12 rounded-xl bg-elevated flex items-center justify-center mb-4">
            <FileText className="w-5 h-5 text-text-muted" />
          </div>
          <p className="font-display text-sm font-semibold text-text-primary mb-1">
            No saved statements
          </p>
          <p className="text-xs text-text-muted mb-5">
            Use &ldquo;Save to Cloud&rdquo; after parsing a PDF to store it here.
          </p>
          <a
            href="/upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-black text-sm font-semibold rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Statement
          </a>
        </div>
      </div>
    );
  }

  const totalTx = items.reduce((s, i) => s + i.summary.record_count, 0);

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Statements", value: items.length.toString() },
          { label: "Transactions", value: totalTx.toString() },
          {
            label: "Net Change",
            value: `${items[0]?.currency || "AED"} ${fmt(items.reduce((s, i) => s + i.summary.net_change, 0))}`,
          },
        ].map(({ label, value }) => (
          <div key={label} className="bg-surface border border-border rounded-xl shadow-surface px-4 py-3">
            <p className="text-[10px] text-text-muted uppercase tracking-widest font-mono font-medium">{label}</p>
            <p className="font-display text-lg font-bold text-text-primary tabular-nums mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="bg-surface border border-border rounded-2xl shadow-surface overflow-hidden">
        <motion.ul
          className="divide-y divide-border"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {items.map((item) => (
            <motion.li key={item.id} className="group flex items-stretch" variants={fadeSlideUp}>
              <a
                href={`/statements/${item.id}`}
                className="flex-1 min-w-0 px-4 sm:px-5 py-4 hover:bg-elevated transition-colors duration-100"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-sm font-semibold text-text-primary truncate">{item.bank}</p>
                    {(item.from_date || item.to_date) && (
                      <div className="flex items-center gap-1 mt-0.5 text-xs font-mono text-text-muted">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {formatDate(item.from_date)} – {formatDate(item.to_date)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.card_type && (
                      <span className="hidden sm:inline text-xs font-medium text-text-secondary bg-elevated border border-border px-2 py-0.5 rounded-full capitalize">
                        {item.card_type}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text-secondary transition-colors" />
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                  <div>
                    <p className="text-[11px] font-mono text-text-muted">Transactions</p>
                    <p className="text-xs font-semibold font-mono text-text-primary tabular-nums">
                      {item.summary.record_count}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-mono text-text-muted">Debit</p>
                    <p className="text-xs font-semibold font-mono text-danger tabular-nums">
                      {item.currency || "AED"} {fmt(item.summary.total_debit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-mono text-text-muted">Credit</p>
                    <p className="text-xs font-semibold font-mono text-success tabular-nums">
                      {item.currency || "AED"} {fmt(item.summary.total_credit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-mono text-text-muted">Net</p>
                    <p
                      className={`text-xs font-semibold font-mono tabular-nums ${
                        item.summary.net_change >= 0 ? "text-success" : "text-danger"
                      }`}
                    >
                      {item.summary.net_change >= 0 ? "+" : ""}
                      {item.currency || "AED"} {fmt(item.summary.net_change)}
                    </p>
                  </div>
                </div>
              </a>

              <div className="flex items-start px-3 pt-4">
                <DeleteButton id={item.id} />
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </div>
  );
}
